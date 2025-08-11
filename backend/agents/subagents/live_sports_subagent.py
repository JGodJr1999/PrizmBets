"""
Live Sports Data Subagent for SmartBets 2.0
Specialized agent for real-time game data extraction, score parsing, and live status management
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from ..base_agent import BaseAgent, AgentTask, Priority

class LiveSportsDataProcessor(BaseAgent):
    """Specialized agent for live sports data processing and real-time score management"""
    
    def __init__(self):
        super().__init__(
            agent_id="live_sports_processor",
            name="Live Sports Data Processor",
            description="Processes live sports data, extracts scores, timing, and game status across all sports"
        )
        self.sport_parsers = {}
        self.live_games_cache = {}
        self.last_update = None
        
    async def initialize(self) -> bool:
        """Initialize sport-specific parsers and data structures"""
        try:
            # Initialize sport-specific parsers
            self.sport_parsers = {
                'nfl': self._parse_nfl_game_data,
                'nba': self._parse_nba_game_data,
                'mlb': self._parse_mlb_game_data,
                'nhl': self._parse_nhl_game_data,
                'wnba': self._parse_wnba_game_data,
                'ncaaf': self._parse_ncaaf_game_data,
                'ncaab': self._parse_ncaab_game_data,
                'soccer': self._parse_soccer_game_data,
                'mma': self._parse_mma_game_data,
                'tennis': self._parse_tennis_game_data
            }
            
            self.logger.info("Live Sports Data Processor initialized with parsers for all sports")
            return True
        except Exception as e:
            self.logger.error(f"Failed to initialize Live Sports Data Processor: {str(e)}")
            return False
    
    async def execute_task(self, task: AgentTask) -> Dict[str, Any]:
        """Execute live sports data processing tasks"""
        task_type = task.description.split(':')[0].lower()
        
        try:
            if task_type == "process_live_data":
                return await self._process_live_data(task.data)
            elif task_type == "parse_game_status":
                return await self._parse_game_status(task.data)
            elif task_type == "extract_scores":
                return await self._extract_scores(task.data)
            elif task_type == "format_live_display":
                return await self._format_live_display(task.data)
            else:
                return {"status": "error", "message": f"Unknown task type: {task_type}"}
                
        except Exception as e:
            self.logger.error(f"Error executing live sports task: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def _process_live_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw live sports data and extract meaningful information"""
        try:
            sport = game_data.get('sport', '').lower()
            
            if sport not in self.sport_parsers:
                return {"status": "error", "message": f"No parser available for sport: {sport}"}
            
            # Use sport-specific parser
            parsed_data = await self.sport_parsers[sport](game_data)
            
            # Cache the processed data
            game_id = game_data.get('id', 'unknown')
            self.live_games_cache[game_id] = parsed_data
            
            return {"status": "success", "data": parsed_data}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    # Sport-specific parsers
    async def _parse_nfl_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse NFL game data for scores, quarters, and time remaining"""
        try:
            live_data = {
                "sport": "nfl",
                "status": self._determine_game_status(game_data),
                "home_score": game_data.get('home_score', 0),
                "away_score": game_data.get('away_score', 0),
                "period": self._extract_nfl_period(game_data),
                "time_remaining": self._extract_nfl_time(game_data),
                "possession": game_data.get('possession'),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            # Add down and distance for NFL if available
            if 'down' in game_data:
                live_data['down'] = game_data['down']
                live_data['yards_to_go'] = game_data.get('yards_to_go', 0)
                live_data['field_position'] = game_data.get('field_position', 'MID')
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing NFL data: {str(e)}")
            return self._default_live_data("nfl")
    
    async def _parse_nba_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse NBA game data for scores, quarters, and time remaining"""
        try:
            live_data = {
                "sport": "nba",
                "status": self._determine_game_status(game_data),
                "home_score": game_data.get('home_score', 0),
                "away_score": game_data.get('away_score', 0),
                "period": self._extract_nba_period(game_data),
                "time_remaining": self._extract_nba_time(game_data),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            # Add NBA-specific data if available
            if 'timeouts_left' in game_data:
                live_data['home_timeouts'] = game_data.get('home_timeouts', 0)
                live_data['away_timeouts'] = game_data.get('away_timeouts', 0)
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing NBA data: {str(e)}")
            return self._default_live_data("nba")
    
    async def _parse_mlb_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse MLB game data for scores, innings, and count"""
        try:
            live_data = {
                "sport": "mlb",
                "status": self._determine_game_status(game_data),
                "home_score": game_data.get('home_score', 0),
                "away_score": game_data.get('away_score', 0),
                "inning": self._extract_mlb_inning(game_data),
                "inning_half": game_data.get('inning_half', 'top'),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            # Add MLB-specific data
            if 'count' in game_data:
                live_data['balls'] = game_data.get('balls', 0)
                live_data['strikes'] = game_data.get('strikes', 0)
                live_data['outs'] = game_data.get('outs', 0)
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing MLB data: {str(e)}")
            return self._default_live_data("mlb")
    
    async def _parse_nhl_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse NHL game data for scores, periods, and time remaining"""
        try:
            live_data = {
                "sport": "nhl",
                "status": self._determine_game_status(game_data),
                "home_score": game_data.get('home_score', 0),
                "away_score": game_data.get('away_score', 0),
                "period": self._extract_nhl_period(game_data),
                "time_remaining": self._extract_nhl_time(game_data),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing NHL data: {str(e)}")
            return self._default_live_data("nhl")
    
    async def _parse_wnba_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse WNBA game data (similar to NBA structure)"""
        return await self._parse_nba_game_data(game_data)
    
    async def _parse_ncaaf_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse NCAA Football game data (similar to NFL structure)"""
        return await self._parse_nfl_game_data(game_data)
    
    async def _parse_ncaab_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse NCAA Basketball game data (similar to NBA structure)"""
        return await self._parse_nba_game_data(game_data)
    
    async def _parse_soccer_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Soccer game data for scores, time, and match status"""
        try:
            live_data = {
                "sport": "soccer",
                "status": self._determine_game_status(game_data),
                "home_score": game_data.get('home_score', 0),
                "away_score": game_data.get('away_score', 0),
                "minute": game_data.get('minute', 0),
                "half": self._extract_soccer_half(game_data),
                "added_time": game_data.get('added_time', 0),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing Soccer data: {str(e)}")
            return self._default_live_data("soccer")
    
    async def _parse_mma_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse MMA fight data"""
        try:
            live_data = {
                "sport": "mma",
                "status": self._determine_game_status(game_data),
                "round": game_data.get('round', 1),
                "time_remaining": game_data.get('time_remaining', '5:00'),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing MMA data: {str(e)}")
            return self._default_live_data("mma")
    
    async def _parse_tennis_game_data(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Tennis match data"""
        try:
            live_data = {
                "sport": "tennis",
                "status": self._determine_game_status(game_data),
                "home_sets": game_data.get('home_sets', 0),
                "away_sets": game_data.get('away_sets', 0),
                "current_set_score": game_data.get('current_set_score', '0-0'),
                "serving": game_data.get('serving', 'home'),
                "last_updated": datetime.utcnow().isoformat() + 'Z'
            }
            
            return live_data
            
        except Exception as e:
            self.logger.error(f"Error parsing Tennis data: {str(e)}")
            return self._default_live_data("tennis")
    
    # Helper methods for extracting sport-specific timing and status
    def _determine_game_status(self, game_data: Dict[str, Any]) -> str:
        """Determine if game is live, scheduled, or completed"""
        status = game_data.get('status', '').lower()
        
        # Map various status formats to standard ones
        if status in ['live', 'in-progress', 'active', 'playing']:
            return 'live'
        elif status in ['final', 'completed', 'finished', 'ended']:
            return 'final'
        elif status in ['scheduled', 'upcoming', 'not-started']:
            return 'scheduled'
        else:
            # Check commence time to determine status
            commence_time = game_data.get('commence_time')
            if commence_time:
                game_time = datetime.fromisoformat(commence_time.replace('Z', ''))
                current_time = datetime.utcnow()
                
                if game_time <= current_time:
                    return 'live'  # Assume live if past commence time
                else:
                    return 'scheduled'
            
            return 'unknown'
    
    def _extract_nfl_period(self, game_data: Dict[str, Any]) -> str:
        """Extract NFL quarter/overtime info"""
        period = game_data.get('period', game_data.get('quarter', 1))
        
        if isinstance(period, int):
            if period <= 4:
                return f"Q{period}"
            else:
                return "OT"
        else:
            return str(period).upper()
    
    def _extract_nfl_time(self, game_data: Dict[str, Any]) -> str:
        """Extract NFL time remaining in quarter"""
        time_remaining = game_data.get('time_remaining', game_data.get('clock', '15:00'))
        return str(time_remaining)
    
    def _extract_nba_period(self, game_data: Dict[str, Any]) -> str:
        """Extract NBA quarter/overtime info"""
        period = game_data.get('period', game_data.get('quarter', 1))
        
        if isinstance(period, int):
            if period <= 4:
                return f"Q{period}"
            else:
                return f"OT{period - 4}" if period > 4 else "OT"
        else:
            return str(period).upper()
    
    def _extract_nba_time(self, game_data: Dict[str, Any]) -> str:
        """Extract NBA time remaining in quarter"""
        time_remaining = game_data.get('time_remaining', game_data.get('clock', '12:00'))
        return str(time_remaining)
    
    def _extract_mlb_inning(self, game_data: Dict[str, Any]) -> int:
        """Extract MLB inning number"""
        return game_data.get('inning', 1)
    
    def _extract_nhl_period(self, game_data: Dict[str, Any]) -> str:
        """Extract NHL period info"""
        period = game_data.get('period', 1)
        
        if isinstance(period, int):
            if period <= 3:
                return f"P{period}"
            else:
                return "OT"
        else:
            return str(period).upper()
    
    def _extract_nhl_time(self, game_data: Dict[str, Any]) -> str:
        """Extract NHL time remaining in period"""
        time_remaining = game_data.get('time_remaining', '20:00')
        return str(time_remaining)
    
    def _extract_soccer_half(self, game_data: Dict[str, Any]) -> str:
        """Extract soccer half information"""
        minute = game_data.get('minute', 0)
        if minute <= 45:
            return "1st Half"
        elif minute <= 90:
            return "2nd Half"
        else:
            return "Extra Time"
    
    def _default_live_data(self, sport: str) -> Dict[str, Any]:
        """Return default live data structure for a sport"""
        return {
            "sport": sport,
            "status": "unknown",
            "last_updated": datetime.utcnow().isoformat() + 'Z',
            "error": "Failed to parse live data"
        }
    
    async def _parse_game_status(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and standardize game status"""
        return {"status": "success", "game_status": self._determine_game_status(data)}
    
    async def _extract_scores(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract scores from game data"""
        return {
            "status": "success",
            "scores": {
                "home": data.get('home_score', 0),
                "away": data.get('away_score', 0)
            }
        }
    
    async def _format_live_display(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format live data for frontend display"""
        sport = data.get('sport', '').lower()
        live_data = data.get('live_data', {})
        
        # Create sport-specific formatted display
        if sport in ['nfl', 'ncaaf']:
            display = f"{live_data.get('period', 'Q1')} {live_data.get('time_remaining', '15:00')}"
        elif sport in ['nba', 'wnba', 'ncaab']:
            display = f"{live_data.get('period', 'Q1')} {live_data.get('time_remaining', '12:00')}"
        elif sport == 'mlb':
            half = "⬆️" if live_data.get('inning_half') == 'top' else "⬇️"
            display = f"{half} {live_data.get('inning', 1)}"
        elif sport == 'nhl':
            display = f"{live_data.get('period', 'P1')} {live_data.get('time_remaining', '20:00')}"
        elif sport == 'soccer':
            minute = live_data.get('minute', 0)
            added = live_data.get('added_time', 0)
            display = f"{minute}'" + (f" +{added}" if added > 0 else "")
        else:
            display = live_data.get('status', 'Live')
        
        return {
            "status": "success",
            "display_text": display,
            "is_live": live_data.get('status') == 'live'
        }


# Factory function for creating the live sports subagent
def create_live_sports_processor() -> LiveSportsDataProcessor:
    """Create and return a configured LiveSportsDataProcessor instance"""
    return LiveSportsDataProcessor()