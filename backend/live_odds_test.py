#!/usr/bin/env python3
"""Test live odds integration with WNBA and other sports"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# The Odds API configuration
ODDS_API_KEY = os.environ.get('ODDS_API_KEY', 'demo_key')
ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

# Sports available for live betting
AVAILABLE_SPORTS = {
    'nfl': 'americanfootball_nfl',
    'nba': 'basketball_nba', 
    'wnba': 'basketball_wnba',
    'mlb': 'baseball_mlb',
    'nhl': 'icehockey_nhl',
    'ncaaf': 'americanfootball_ncaaf',
    'ncaab': 'basketball_ncaab',
    'soccer': 'soccer_epl',
    'mma': 'mma_mixed_martial_arts'
}

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 Live Odds API Test',
        'status': 'success',
        'api_key_configured': bool(ODDS_API_KEY and ODDS_API_KEY != 'demo_key'),
        'available_sports': list(AVAILABLE_SPORTS.keys()),
        'endpoints': [
            '/api/odds/sports',
            '/api/odds/live/{sport}',
            '/api/odds/best',
            '/api/odds/comparison/{sport}'
        ]
    })

@app.route('/api/odds/sports', methods=['GET'])
def get_supported_sports():
    """Get list of supported sports with current availability"""
    try:
        # Get available sports from The Odds API
        if ODDS_API_KEY and ODDS_API_KEY != 'demo_key':
            response = requests.get(
                f'{ODDS_API_BASE}/sports',
                params={'apiKey': ODDS_API_KEY},
                timeout=10
            )
            
            if response.status_code == 200:
                api_sports = response.json()
                available_sports = []
                
                for sport in api_sports:
                    if sport['key'] in AVAILABLE_SPORTS.values():
                        # Map back to our friendly names
                        for friendly_name, api_key in AVAILABLE_SPORTS.items():
                            if api_key == sport['key']:
                                available_sports.append({
                                    'key': friendly_name,
                                    'name': sport['description'],
                                    'active': sport['active'],
                                    'has_outrights': sport['has_outrights']
                                })
                                break
                
                return jsonify({
                    'success': True,
                    'sports': available_sports,
                    'data_source': 'live_api'
                })
        
        # Fallback mock data
        mock_sports = [
            {'key': 'nfl', 'name': 'NFL', 'active': True, 'has_outrights': True},
            {'key': 'nba', 'name': 'NBA', 'active': True, 'has_outrights': True},
            {'key': 'wnba', 'name': 'WNBA', 'active': True, 'has_outrights': False},
            {'key': 'mlb', 'name': 'MLB', 'active': True, 'has_outrights': True},
            {'key': 'nhl', 'name': 'NHL', 'active': False, 'has_outrights': True},
            {'key': 'ncaaf', 'name': 'College Football', 'active': False, 'has_outrights': True},
            {'key': 'ncaab', 'name': 'College Basketball', 'active': True, 'has_outrights': True},
            {'key': 'soccer', 'name': 'Soccer (EPL)', 'active': True, 'has_outrights': True},
            {'key': 'mma', 'name': 'MMA/UFC', 'active': True, 'has_outrights': False}
        ]
        
        return jsonify({
            'success': True,
            'sports': mock_sports,
            'data_source': 'mock_data',
            'note': 'Configure ODDS_API_KEY for live data'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch sports: {str(e)}'}), 500

@app.route('/api/odds/live/<sport>', methods=['GET'])
def get_live_odds(sport):
    """Get live odds for a specific sport"""
    try:
        sport_key = AVAILABLE_SPORTS.get(sport.lower())
        if not sport_key:
            return jsonify({'error': f'Unsupported sport: {sport}'}), 400
        
        # Get live odds from The Odds API
        if ODDS_API_KEY and ODDS_API_KEY != 'demo_key':
            response = requests.get(
                f'{ODDS_API_BASE}/sports/{sport_key}/odds',
                params={
                    'apiKey': ODDS_API_KEY,
                    'regions': 'us',
                    'markets': 'h2h,spreads,totals',
                    'oddsFormat': 'american',
                    'dateFormat': 'iso'
                },
                timeout=15
            )
            
            if response.status_code == 200:
                odds_data = response.json()
                
                # Transform data for our frontend
                formatted_games = []
                for game in odds_data[:10]:  # Limit to 10 games
                    formatted_game = {
                        'id': game['id'],
                        'sport': sport,
                        'home_team': game['home_team'],
                        'away_team': game['away_team'],
                        'commence_time': game['commence_time'],
                        'sportsbooks': {}
                    }
                    
                    for bookmaker in game.get('bookmakers', []):
                        book_name = bookmaker['key']
                        formatted_game['sportsbooks'][book_name] = {
                            'moneyline': {},
                            'spread': {},
                            'total': {}
                        }
                        
                        for market in bookmaker.get('markets', []):
                            market_type = market['key']
                            
                            if market_type == 'h2h':  # Moneyline
                                for outcome in market['outcomes']:
                                    team_key = 'home' if outcome['name'] == game['home_team'] else 'away'
                                    formatted_game['sportsbooks'][book_name]['moneyline'][team_key] = outcome['price']
                                    
                            elif market_type == 'spreads':  # Point spreads
                                for outcome in market['outcomes']:
                                    team_key = 'home' if outcome['name'] == game['home_team'] else 'away'
                                    formatted_game['sportsbooks'][book_name]['spread'][team_key] = {
                                        'price': outcome['price'],
                                        'point': outcome.get('point', 0)
                                    }
                                    
                            elif market_type == 'totals':  # Over/Under
                                for outcome in market['outcomes']:
                                    formatted_game['sportsbooks'][book_name]['total'][outcome['name'].lower()] = {
                                        'price': outcome['price'],
                                        'point': outcome.get('point', 0)
                                    }
                    
                    formatted_games.append(formatted_game)
                
                return jsonify({
                    'success': True,
                    'sport': sport.upper(),
                    'games': formatted_games,
                    'data_source': 'live_api',
                    'last_updated': datetime.utcnow().isoformat()
                })
        
        # Mock WNBA data for demonstration
        if sport.lower() == 'wnba':
            mock_wnba_games = [
                {
                    'id': 'wnba_game_1',
                    'sport': 'wnba',
                    'home_team': 'Las Vegas Aces',
                    'away_team': 'New York Liberty',
                    'commence_time': '2025-08-05T02:00:00Z',
                    'sportsbooks': {
                        'draftkings': {
                            'moneyline': {'home': -140, 'away': +120},
                            'spread': {'home': {'price': -110, 'point': -3.0}, 'away': {'price': -110, 'point': 3.0}},
                            'total': {'over': {'price': -110, 'point': 165.5}, 'under': {'price': -110, 'point': 165.5}}
                        },
                        'fanduel': {
                            'moneyline': {'home': -135, 'away': +115},
                            'spread': {'home': {'price': -105, 'point': -3.0}, 'away': {'price': -115, 'point': 3.0}},
                            'total': {'over': {'price': -108, 'point': 165.5}, 'under': {'price': -112, 'point': 165.5}}
                        },
                        'betmgm': {
                            'moneyline': {'home': -145, 'away': +125},
                            'spread': {'home': {'price': -112, 'point': -3.0}, 'away': {'price': -108, 'point': 3.0}},
                            'total': {'over': {'price': -110, 'point': 166.0}, 'under': {'price': -110, 'point': 166.0}}
                        }
                    }
                },
                {
                    'id': 'wnba_game_2',
                    'sport': 'wnba',
                    'home_team': 'Connecticut Sun',
                    'away_team': 'Seattle Storm',
                    'commence_time': '2025-08-05T23:30:00Z',
                    'sportsbooks': {
                        'draftkings': {
                            'moneyline': {'home': +105, 'away': -125},
                            'spread': {'home': {'price': -110, 'point': 2.5}, 'away': {'price': -110, 'point': -2.5}},
                            'total': {'over': {'price': -110, 'point': 162.5}, 'under': {'price': -110, 'point': 162.5}}
                        },
                        'fanduel': {
                            'moneyline': {'home': +108, 'away': -128},
                            'spread': {'home': {'price': -108, 'point': 2.5}, 'away': {'price': -112, 'point': -2.5}},
                            'total': {'over': {'price': -110, 'point': 162.0}, 'under': {'price': -110, 'point': 162.0}}
                        },
                        'betmgm': {
                            'moneyline': {'home': +110, 'away': -130},
                            'spread': {'home': {'price': -105, 'point': 2.5}, 'away': {'price': -115, 'point': -2.5}},
                            'total': {'over': {'price': -108, 'point': 163.0}, 'under': {'price': -112, 'point': 163.0}}
                        }
                    }
                }
            ]
            
            return jsonify({
                'success': True,
                'sport': 'WNBA',
                'games': mock_wnba_games,
                'data_source': 'mock_data',
                'last_updated': datetime.utcnow().isoformat(),
                'note': 'Configure ODDS_API_KEY for live WNBA data'
            })
        
        # Mock data for other sports
        mock_games = [
            {
                'id': f'{sport}_game_1',
                'sport': sport,
                'home_team': f'{sport.upper()} Home Team',
                'away_team': f'{sport.upper()} Away Team',
                'commence_time': '2025-08-05T20:00:00Z',
                'sportsbooks': {
                    'draftkings': {
                        'moneyline': {'home': -110, 'away': -110},
                        'spread': {'home': {'price': -110, 'point': -1.5}, 'away': {'price': -110, 'point': 1.5}}
                    },
                    'fanduel': {
                        'moneyline': {'home': -105, 'away': -115},
                        'spread': {'home': {'price': -105, 'point': -1.5}, 'away': {'price': -115, 'point': 1.5}}
                    }
                }
            }
        ]
        
        return jsonify({
            'success': True,
            'sport': sport.upper(),
            'games': mock_games,
            'data_source': 'mock_data',
            'last_updated': datetime.utcnow().isoformat(),
            'note': 'Configure ODDS_API_KEY for live data'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch odds: {str(e)}'}), 500

@app.route('/api/odds/best', methods=['POST'])
def get_best_odds():
    """Find best odds for a specific bet"""
    try:
        data = request.get_json()
        team = data.get('team', '')
        sport = data.get('sport', 'nfl')
        bet_type = data.get('bet_type', 'moneyline')
        
        # For demo, return best odds analysis
        return jsonify({
            'success': True,
            'team': team,
            'sport': sport,
            'bet_type': bet_type,
            'best_odds': {
                'sportsbook': 'fanduel',
                'odds': -105,
                'potential_payout': 95.24
            },
            'all_sportsbooks': {
                'draftkings': -110,
                'fanduel': -105,
                'betmgm': -108,
                'caesars': -112
            },
            'savings': {
                'amount': 4.76,
                'percentage': '4.8%',
                'vs_worst': 'caesars'
            },
            'recommendation': 'Bet with FanDuel for best value - save 4.8% vs worst odds',
            'deep_links': {
                'fanduel': f'https://sportsbook.fanduel.com?ref=smartbets&team={team}&sport={sport}'
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to find best odds: {str(e)}'}), 500

@app.route('/api/odds/comparison/<sport>', methods=['GET'])
def get_odds_comparison(sport):
    """Get comprehensive odds comparison for a sport"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Get live odds data directly
        sport_key = AVAILABLE_SPORTS.get(sport.lower())
        if not sport_key:
            return jsonify({'error': f'Unsupported sport: {sport}'}), 400
        
        # Use mock WNBA data for now
        if sport.lower() == 'wnba':
            games = [
                {
                    'id': 'wnba_game_1',
                    'sport': 'wnba',
                    'home_team': 'Las Vegas Aces',
                    'away_team': 'New York Liberty',
                    'commence_time': '2025-08-05T02:00:00Z',
                    'sportsbooks': {
                        'draftkings': {'moneyline': {'home': -140, 'away': +120}},
                        'fanduel': {'moneyline': {'home': -135, 'away': +115}},
                        'betmgm': {'moneyline': {'home': -145, 'away': +125}}
                    }
                },
                {
                    'id': 'wnba_game_2',
                    'sport': 'wnba',
                    'home_team': 'Connecticut Sun',
                    'away_team': 'Seattle Storm',
                    'commence_time': '2025-08-05T23:30:00Z',
                    'sportsbooks': {
                        'draftkings': {'moneyline': {'home': +105, 'away': -125}},
                        'fanduel': {'moneyline': {'home': +108, 'away': -128}},
                        'betmgm': {'moneyline': {'home': +110, 'away': -130}}
                    }
                }
            ]
            response_data = {'success': True, 'games': games}
        else:
            response_data = {'success': False, 'games': []}
        
        if response_data.get('success'):
            games = response_data.get('games', [])[:limit]
            
            # Add best odds analysis for each game
            for game in games:
                # Find best moneyline odds for each team
                home_odds = []
                away_odds = []
                
                for book_name, book_odds in game['sportsbooks'].items():
                    if 'moneyline' in book_odds:
                        if 'home' in book_odds['moneyline']:
                            home_odds.append((book_name, book_odds['moneyline']['home']))
                        if 'away' in book_odds['moneyline']:
                            away_odds.append((book_name, book_odds['moneyline']['away']))
                
                # Find best odds
                if home_odds:
                    best_home = max(home_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in home_odds) else min(home_odds, key=lambda x: abs(x[1]))
                    game['best_home_odds'] = {'sportsbook': best_home[0], 'odds': best_home[1]}
                
                if away_odds:
                    best_away = max(away_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in away_odds) else min(away_odds, key=lambda x: abs(x[1]))
                    game['best_away_odds'] = {'sportsbook': best_away[0], 'odds': best_away[1]}
            
            return jsonify({
                'success': True,
                'sport': sport.upper(),
                'games': games,
                'comparison_summary': {
                    'total_games': len(games),
                    'sportsbooks_compared': len(set().union(*[game['sportsbooks'].keys() for game in games])) if games else 0,
                    'best_value_opportunities': sum(1 for game in games if 'best_home_odds' in game or 'best_away_odds' in game)
                }
            })
        else:
            return response
            
    except Exception as e:
        return jsonify({'error': f'Failed to get comparison: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting SmartBets Live Odds API...")
    print(f"API Key Configured: {bool(ODDS_API_KEY and ODDS_API_KEY != 'demo_key')}")
    print("Available at: http://localhost:5004")
    print(f"Supported Sports: {', '.join(AVAILABLE_SPORTS.keys())}")
    app.run(debug=True, host='0.0.0.0', port=5004)