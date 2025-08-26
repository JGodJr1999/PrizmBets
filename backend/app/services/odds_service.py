"""
Enhanced Odds Service with The Odds API Integration
Provides real-time sportsbook odds comparison and best odds finding
"""

import requests
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from flask import current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TheOddsAPIService:
    """Service for integrating with The Odds API"""
    
    def __init__(self):
        self.api_key = os.environ.get('ODDS_API_KEY')
        self.base_url = 'https://api.the-odds-api.com/v4'
        self.timeout = 10
        
        # Sports mapping for The Odds API
        self.sports_mapping = {
            'nfl': 'americanfootball_nfl',
            'nba': 'basketball_nba',
            'wnba': 'basketball_wnba',
            'mlb': 'baseball_mlb',
            'nhl': 'icehockey_nhl',
            'ncaaf': 'americanfootball_ncaaf',
            'ncaab': 'basketball_ncaab',
            'soccer': 'soccer_epl',
            'mma': 'mma_mixed_martial_arts',
            'tennis': 'tennis_atp',
            'golf': 'golf_pga',
            'ufc': 'mma_mixed_martial_arts',
            'premier_league': 'soccer_epl',
            'champions_league': 'soccer_uefa_champs_league',
            'nascar': 'motorsport_nascar',
            'f1': 'motorsport_formula1',
            'formula1': 'motorsport_formula1'
        }
        
        # Major US sportsbooks supported by The Odds API
        self.priority_sportsbooks = [
            'draftkings',
            'fanduel', 
            'betmgm',
            'caesars',
            'betrivers',
            'espnbet',
            'fanatics',
            'betway',
            'betus',
            'bovada'
        ]
        
        # Bet type mappings
        self.market_mapping = {
            'moneyline': 'h2h',          # Head to head (moneyline)
            'spread': 'spreads',         # Point spreads
            'over_under': 'totals',      # Over/Under totals
            'prop': 'player_props'       # Player props (if available)
        }

    def _make_api_request(self, endpoint: str, params: Dict) -> Optional[Dict]:
        """Make API request to The Odds API with error handling"""
        if not self.api_key:
            logger.error("The Odds API key not found in environment variables")
            return None
            
        url = f"{self.base_url}/{endpoint}"
        params['apiKey'] = self.api_key
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            # Log remaining API calls for monitoring
            remaining_calls = response.headers.get('x-requests-remaining')
            if remaining_calls:
                logger.info(f"API calls remaining: {remaining_calls}")
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            return None
        except ValueError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return None

    def get_live_odds(self, sport: str, market: str = 'h2h') -> Optional[List[Dict]]:
        """
        Get live odds for a specific sport and market
        
        Args:
            sport: Sport key (e.g., 'nfl', 'nba')
            market: Market type ('h2h', 'spreads', 'totals')
            
        Returns:
            List of games with odds from multiple sportsbooks
        """
        sport_key = self.sports_mapping.get(sport.lower())
        if not sport_key:
            logger.error(f"Unsupported sport: {sport}")
            return None
            
        params = {
            'sport': sport_key,
            'markets': market,
            'regions': 'us',
            'oddsFormat': 'american',
            'dateFormat': 'iso'
        }
        
        return self._make_api_request('sports/{}/odds'.format(sport_key), params)

    def find_best_odds_for_bet(self, sport: str, team: str, bet_type: str) -> Dict[str, Any]:
        """
        Find the best odds across all sportsbooks for a specific bet
        
        Args:
            sport: Sport (e.g., 'nfl', 'nba')
            team: Team name to bet on
            bet_type: Type of bet ('moneyline', 'spread', 'over_under')
            
        Returns:
            Dictionary with best odds information
        """
        market = self.market_mapping.get(bet_type, 'h2h')
        odds_data = self.get_live_odds(sport, market)
        
        if not odds_data:
            return self._get_fallback_odds(team, bet_type)
        
        best_odds = {
            'team': team,
            'bet_type': bet_type,
            'best_sportsbook': None,
            'best_odds': None,
            'best_payout_ratio': 0,
            'all_odds': {},
            'last_updated': datetime.utcnow().isoformat(),
            'games_found': len(odds_data)
        }
        
        # Find the game with the specified team
        target_game = None
        for game in odds_data:
            if (team.lower() in game['home_team'].lower() or 
                team.lower() in game['away_team'].lower()):
                target_game = game
                break
        
        if not target_game:
            logger.warning(f"No game found for team: {team}")
            return best_odds
        
        # Compare odds across all sportsbooks for this game
        for bookmaker in target_game.get('bookmakers', []):
            book_name = bookmaker['key']
            
            # Only include priority sportsbooks
            if book_name not in self.priority_sportsbooks:
                continue
                
            for market_data in bookmaker.get('markets', []):
                if market_data['key'] == market:
                    odds = self._extract_team_odds(market_data, team, target_game)
                    if odds:
                        best_odds['all_odds'][book_name] = odds
                        
                        # Calculate implied probability and find best value
                        payout_ratio = self._calculate_payout_ratio(odds)
                        if payout_ratio > best_odds['best_payout_ratio']:
                            best_odds['best_payout_ratio'] = payout_ratio
                            best_odds['best_sportsbook'] = book_name
                            best_odds['best_odds'] = odds
        
        return best_odds

    def _extract_team_odds(self, market_data: Dict, team: str, game: Dict) -> Optional[int]:
        """Extract odds for a specific team from market data"""
        for outcome in market_data.get('outcomes', []):
            if team.lower() in outcome['name'].lower():
                return outcome['price']
        return None

    def _calculate_payout_ratio(self, odds: int) -> float:
        """Calculate payout ratio from American odds"""
        if odds > 0:
            return odds / 100
        else:
            return 100 / abs(odds)

    def _get_fallback_odds(self, team: str, bet_type: str) -> Dict[str, Any]:
        """Return fallback odds when API is unavailable"""
        return {
            'team': team,
            'bet_type': bet_type,
            'best_sportsbook': 'draftkings',
            'best_odds': -110,
            'best_payout_ratio': 0.91,
            'all_odds': {
                'draftkings': -110,
                'fanduel': -115,
                'betmgm': -105,
                'caesars': -112
            },
            'last_updated': datetime.utcnow().isoformat(),
            'fallback_data': True,
            'message': 'Using fallback odds - API unavailable'
        }

    def get_sportsbook_link(self, sportsbook: str) -> str:
        """
        Get safe sportsbook homepage link (no affiliate tracking or bet facilitation)
        
        Args:
            sportsbook: Sportsbook name
            
        Returns:
            Safe homepage URL for informational purposes only
        """
        # Safe sportsbook homepage links - no affiliate tracking
        sportsbook_homepages = {
            'draftkings': 'https://www.draftkings.com',
            'fanduel': 'https://www.fanduel.com',
            'betmgm': 'https://www.betmgm.com',
            'caesars': 'https://www.caesars.com/sportsbook',
            'betrivers': 'https://www.betrivers.com',
            'espnbet': 'https://espnbet.com',
            'fanatics': 'https://fanatics.com/betting'
        }
        
        return sportsbook_homepages.get(sportsbook.lower(), f"https://www.{sportsbook.lower()}.com")

    def get_odds_movement(self, sport: str, team: str, hours_back: int = 24) -> Dict[str, Any]:
        """
        Get historical odds movement (placeholder for future implementation)
        
        Note: The Odds API provides historical data but requires separate endpoints
        """
        return {
            'team': team,
            'sport': sport,
            'movement_data': [],
            'current_trend': 'stable',
            'sharp_money_indicator': False,
            'message': 'Historical odds tracking coming soon'
        }


class OddsService:
    """Main odds service that coordinates between different providers"""
    
    def __init__(self):
        self.odds_api = TheOddsAPIService()
        self.cache_duration = 300  # 5 minutes cache for odds data
        
    def get_best_odds(self, bet_type: str, team: str, sport: str = 'nfl') -> Dict[str, Any]:
        """
        Find best odds across all sportsbooks
        
        Args:
            bet_type: Type of bet ('moneyline', 'spread', 'over_under')
            team: Team name
            sport: Sport type
            
        Returns:
            Best odds information with sportsbook comparison
        """
        try:
            result = self.odds_api.find_best_odds_for_bet(sport, team, bet_type)
            
            # Add additional metadata
            result['comparison_count'] = len(result.get('all_odds', {}))
            result['potential_savings'] = self._calculate_potential_savings(result.get('all_odds', {}))
            result['recommendation'] = self._generate_recommendation(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting best odds: {str(e)}")
            return self.odds_api._get_fallback_odds(team, bet_type)
    
    def get_sportsbook_comparison(self, sport: str, games_limit: int = 10) -> List[Dict]:
        """
        Get comprehensive sportsbook comparison for current games
        
        Args:
            sport: Sport type
            games_limit: Maximum number of games to return
            
        Returns:
            List of games with odds comparison
        """
        try:
            odds_data = self.odds_api.get_live_odds(sport, 'h2h')
            if not odds_data:
                return []
                
            comparison_data = []
            for game in odds_data[:games_limit]:
                game_comparison = {
                    'game_id': game.get('id'),
                    'home_team': game.get('home_team'),
                    'away_team': game.get('away_team'),
                    'commence_time': game.get('commence_time'),
                    'sportsbooks': {}
                }
                
                for bookmaker in game.get('bookmakers', []):
                    if bookmaker['key'] in self.odds_api.priority_sportsbooks:
                        game_comparison['sportsbooks'][bookmaker['key']] = {
                            'home_odds': None,
                            'away_odds': None
                        }
                        
                        for market in bookmaker.get('markets', []):
                            if market['key'] == 'h2h':
                                for outcome in market.get('outcomes', []):
                                    if outcome['name'] == game['home_team']:
                                        game_comparison['sportsbooks'][bookmaker['key']]['home_odds'] = outcome['price']
                                    elif outcome['name'] == game['away_team']:
                                        game_comparison['sportsbooks'][bookmaker['key']]['away_odds'] = outcome['price']
                
                comparison_data.append(game_comparison)
            
            return comparison_data
            
        except Exception as e:
            logger.error(f"Error getting sportsbook comparison: {str(e)}")
            return []
    
    def _calculate_potential_savings(self, all_odds: Dict[str, int]) -> Dict[str, Any]:
        """Calculate potential savings by shopping odds"""
        if len(all_odds) < 2:
            return {'amount': 0, 'percentage': 0}
            
        odds_values = list(all_odds.values())
        best_odds = max(odds_values)
        worst_odds = min(odds_values)
        
        # Calculate savings on a $100 bet
        best_payout = self.odds_api._calculate_payout_ratio(best_odds) * 100
        worst_payout = self.odds_api._calculate_payout_ratio(worst_odds) * 100
        
        savings = best_payout - worst_payout
        percentage = (savings / worst_payout) * 100 if worst_payout > 0 else 0
        
        return {
            'amount': round(savings, 2),
            'percentage': round(percentage, 2),
            'best_book': max(all_odds, key=all_odds.get),
            'worst_book': min(all_odds, key=all_odds.get)
        }
    
    def _generate_recommendation(self, odds_data: Dict) -> str:
        """Generate betting recommendation based on odds analysis"""
        if not odds_data.get('all_odds'):
            return "Unable to compare odds - check back later"
            
        savings = odds_data.get('potential_savings', {})
        
        if savings.get('percentage', 0) > 5:
            return f"Strong value! Save {savings['percentage']:.1f}% by betting with {odds_data['best_sportsbook']}"
        elif savings.get('percentage', 0) > 2:
            return f"Good value at {odds_data['best_sportsbook']} - {savings['percentage']:.1f}% better odds"
        else:
            return f"Similar odds across books - {odds_data['best_sportsbook']} has slight edge"
    
    def get_sportsbook_link(self, sportsbook: str) -> str:
        """Get safe sportsbook homepage link"""
        return self.odds_api.get_sportsbook_link(sportsbook)
    
    def get_line_movement(self, bet_id: str) -> Dict[str, Any]:
        """Get historical line movement data"""
        return self.odds_api.get_odds_movement('nfl', 'team', 24)