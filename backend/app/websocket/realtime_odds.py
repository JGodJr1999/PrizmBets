#!/usr/bin/env python3
"""
Real-time Odds WebSocket System for PrizmBets
Provides live odds updates to connected clients
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Set, List, Optional
import websockets
import threading
from concurrent.futures import ThreadPoolExecutor
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.cached_sports_service import CachedSportsService

logger = logging.getLogger(__name__)

class RealTimeOddsServer:
    """WebSocket server for real-time odds updates"""
    
    def __init__(self, port: int = 8765):
        self.port = port
        self.connected_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.sports_service = CachedSportsService()
        self.update_interval = 30  # Update every 30 seconds
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Track client subscriptions
        self.client_subscriptions: Dict[websockets.WebSocketServerProtocol, Set[str]] = {}
        
        # Cache for odds data to detect changes
        self.odds_cache: Dict[str, Dict] = {}
    
    async def register_client(self, websocket: websockets.WebSocketServerProtocol):
        """Register a new WebSocket client"""
        self.connected_clients.add(websocket)
        self.client_subscriptions[websocket] = set()
        logger.info(f"Client connected. Total clients: {len(self.connected_clients)}")
        
        # Send welcome message
        welcome_msg = {
            'type': 'welcome',
            'message': 'Connected to PrizmBets real-time odds',
            'timestamp': datetime.utcnow().isoformat(),
            'server_time': int(time.time())
        }
        await self.send_to_client(websocket, welcome_msg)
    
    async def unregister_client(self, websocket: websockets.WebSocketServerProtocol):
        """Unregister a WebSocket client"""
        if websocket in self.connected_clients:
            self.connected_clients.remove(websocket)
        
        if websocket in self.client_subscriptions:
            del self.client_subscriptions[websocket]
        
        logger.info(f"Client disconnected. Total clients: {len(self.connected_clients)}")
    
    async def handle_client_message(self, websocket: websockets.WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            message_type = data.get('type', '')
            
            if message_type == 'subscribe':
                await self.handle_subscription(websocket, data)
            elif message_type == 'unsubscribe':
                await self.handle_unsubscription(websocket, data)
            elif message_type == 'ping':
                await self.handle_ping(websocket, data)
            else:
                await self.send_error(websocket, f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error(websocket, "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
            await self.send_error(websocket, "Internal server error")
    
    async def handle_subscription(self, websocket: websockets.WebSocketServerProtocol, data: Dict):
        """Handle client subscription request"""
        sport = data.get('sport', '')
        
        if not sport:
            await self.send_error(websocket, "Sport parameter required")
            return
        
        # Add sport to client subscriptions
        self.client_subscriptions[websocket].add(sport)
        
        # Send current odds data immediately
        current_odds = await self.get_sport_odds(sport)
        if current_odds:
            response = {
                'type': 'odds_update',
                'sport': sport,
                'data': current_odds,
                'timestamp': datetime.utcnow().isoformat()
            }
            await self.send_to_client(websocket, response)
        
        # Send subscription confirmation
        confirmation = {
            'type': 'subscription_confirmed',
            'sport': sport,
            'message': f'Subscribed to {sport} odds updates'
        }
        await self.send_to_client(websocket, confirmation)
    
    async def handle_unsubscription(self, websocket: websockets.WebSocketServerProtocol, data: Dict):
        """Handle client unsubscription request"""
        sport = data.get('sport', '')
        
        if sport in self.client_subscriptions.get(websocket, set()):
            self.client_subscriptions[websocket].discard(sport)
            
            confirmation = {
                'type': 'unsubscription_confirmed',
                'sport': sport,
                'message': f'Unsubscribed from {sport} odds updates'
            }
            await self.send_to_client(websocket, confirmation)
    
    async def handle_ping(self, websocket: websockets.WebSocketServerProtocol, data: Dict):
        """Handle ping message for connection keepalive"""
        pong_response = {
            'type': 'pong',
            'timestamp': datetime.utcnow().isoformat(),
            'client_timestamp': data.get('timestamp')
        }
        await self.send_to_client(websocket, pong_response)
    
    async def send_to_client(self, websocket: websockets.WebSocketServerProtocol, data: Dict):
        """Send data to a specific client"""
        try:
            message = json.dumps(data)
            await websocket.send(message)
        except websockets.exceptions.ConnectionClosed:
            await self.unregister_client(websocket)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
    
    async def send_error(self, websocket: websockets.WebSocketServerProtocol, error_message: str):
        """Send error message to client"""
        error_response = {
            'type': 'error',
            'message': error_message,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_client(websocket, error_response)
    
    async def broadcast_to_subscribers(self, sport: str, odds_data: Dict):
        """Broadcast odds update to all subscribers of a sport"""
        if not self.connected_clients:
            return
        
        message = {
            'type': 'odds_update',
            'sport': sport,
            'data': odds_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Get clients subscribed to this sport
        subscribers = [
            client for client, subscriptions in self.client_subscriptions.items()
            if sport in subscriptions and client in self.connected_clients
        ]
        
        if subscribers:
            # Send to all subscribers concurrently
            await asyncio.gather(
                *[self.send_to_client(client, message) for client in subscribers],
                return_exceptions=True
            )
            
            logger.info(f"Broadcasted {sport} odds to {len(subscribers)} clients")
    
    async def get_sport_odds(self, sport: str) -> Optional[Dict]:
        """Get odds data for a specific sport"""
        try:
            # Map common sport names to service keys
            sport_mapping = {
                'nfl': 'americanfootball_nfl',
                'nba': 'basketball_nba',
                'mlb': 'baseball_mlb',
                'nhl': 'icehockey_nhl',
                'soccer': 'soccer_epl',
                'ncaaf': 'americanfootball_ncaaf',
                'ncaab': 'basketball_ncaab'
            }
            
            service_key = sport_mapping.get(sport.lower(), sport)
            
            # Get odds data from sports service
            odds_data = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                lambda: self.sports_service.get_live_odds(service_key, limit=50)
            )
            
            if odds_data and odds_data.get('success'):
                return {
                    'games': odds_data.get('games', []),
                    'total_games': len(odds_data.get('games', [])),
                    'data_source': odds_data.get('data_source', 'live'),
                    'cache_performance': odds_data.get('cache_performance', {}),
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting odds for {sport}: {e}")
            return None
    
    def has_odds_changed(self, sport: str, new_odds: Dict) -> bool:
        """Check if odds have changed since last update"""
        if sport not in self.odds_cache:
            return True
        
        old_odds = self.odds_cache[sport]
        
        # Compare game count first
        if len(new_odds.get('games', [])) != len(old_odds.get('games', [])):
            return True
        
        # Compare individual games (simplified comparison)
        new_games = new_odds.get('games', [])
        old_games = old_odds.get('games', [])
        
        for i, new_game in enumerate(new_games):
            if i < len(old_games):
                old_game = old_games[i]
                
                # Check if teams or odds changed
                if (new_game.get('home_team') != old_game.get('home_team') or
                    new_game.get('away_team') != old_game.get('away_team')):
                    return True
                
                # Check sportsbook odds changes
                new_sbooks = new_game.get('sportsbooks', {})
                old_sbooks = old_game.get('sportsbooks', {})
                
                if new_sbooks != old_sbooks:
                    return True
        
        return False
    
    async def odds_update_loop(self):
        """Main loop for updating and broadcasting odds"""
        logger.info("Starting odds update loop")
        
        while self.running:
            try:
                # Get all unique sports that clients are subscribed to
                subscribed_sports = set()
                for subscriptions in self.client_subscriptions.values():
                    subscribed_sports.update(subscriptions)
                
                # Update each subscribed sport
                for sport in subscribed_sports:
                    new_odds = await self.get_sport_odds(sport)
                    
                    if new_odds and self.has_odds_changed(sport, new_odds):
                        # Cache the new odds
                        self.odds_cache[sport] = new_odds
                        
                        # Broadcast to subscribers
                        await self.broadcast_to_subscribers(sport, new_odds)
                
                # Wait before next update
                await asyncio.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"Error in odds update loop: {e}")
                await asyncio.sleep(5)  # Short delay before retrying
    
    async def client_handler(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Handle individual client connections"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                await self.handle_client_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"Error in client handler: {e}")
        finally:
            await self.unregister_client(websocket)
    
    async def start_server(self):
        """Start the WebSocket server"""
        self.running = True
        
        # Start the odds update loop
        asyncio.create_task(self.odds_update_loop())
        
        # Start the WebSocket server
        logger.info(f"Starting WebSocket server on port {self.port}")
        
        async with websockets.serve(
            self.client_handler,
            "localhost",
            self.port,
            ping_interval=30,  # Send ping every 30 seconds
            ping_timeout=10,   # Wait 10 seconds for pong
            max_size=10**6,    # 1MB message size limit
            compression=None   # Disable compression for better performance
        ):
            logger.info(f"WebSocket server running on ws://localhost:{self.port}")
            
            # Keep the server running
            await asyncio.Future()  # Run forever
    
    def stop_server(self):
        """Stop the WebSocket server"""
        self.running = False
        logger.info("WebSocket server stopping")

# Frontend WebSocket client integration helper
def get_websocket_client_code() -> str:
    """Generate JavaScript code for frontend WebSocket integration"""
    return """
// PrizmBets WebSocket Client
class PrizmBetsWebSocket {
    constructor(url = 'ws://localhost:8765') {
        this.url = url;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Set();
        this.eventHandlers = {
            'odds_update': [],
            'connection_status': [],
            'error': []
        };
    }
    
    connect() {
        try {
            this.socket = new WebSocket(this.url);
            
            this.socket.onopen = () => {
                console.log('Connected to PrizmBets WebSocket');
                this.reconnectAttempts = 0;
                this.notifyHandlers('connection_status', { connected: true });
                
                // Re-subscribe to all sports
                this.subscriptions.forEach(sport => {
                    this.subscribe(sport);
                });
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket connection closed');
                this.notifyHandlers('connection_status', { connected: false });
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyHandlers('error', { error: 'Connection error' });
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.notifyHandlers('error', { error: 'Failed to connect' });
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'odds_update':
                this.notifyHandlers('odds_update', data);
                break;
            case 'error':
                this.notifyHandlers('error', data);
                break;
            case 'welcome':
            case 'subscription_confirmed':
            case 'unsubscription_confirmed':
                console.log('Server message:', data.message);
                break;
        }
    }
    
    subscribe(sport) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                sport: sport
            }));
            this.subscriptions.add(sport);
        }
    }
    
    unsubscribe(sport) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'unsubscribe',
                sport: sport
            }));
            this.subscriptions.delete(sport);
        }
    }
    
    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }
    
    notifyHandlers(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Reconnecting... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                this.reconnectAttempts++;
                this.connect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Usage example:
// const wsClient = new PrizmBetsWebSocket();
// wsClient.on('odds_update', (data) => {
//     console.log('Odds updated:', data);
// });
// wsClient.connect();
// wsClient.subscribe('nfl');
"""

if __name__ == '__main__':
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create and start the server
    server = RealTimeOddsServer(port=8765)
    
    print("=" * 60)
    print("PRIZMBETS REAL-TIME ODDS WEBSOCKET SERVER")
    print("=" * 60)
    print("WebSocket URL: ws://localhost:8765")
    print("Features: Real-time odds updates, sport subscriptions")
    print("Clients can subscribe to: nfl, nba, mlb, nhl, soccer, ncaaf, ncaab")
    print("=" * 60)
    
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("\nShutting down WebSocket server...")
        server.stop_server()
    except Exception as e:
        logger.error(f"Server error: {e}")
        server.stop_server()