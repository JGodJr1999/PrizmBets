#!/usr/bin/env python3
"""Comprehensive Live Odds API with all sports and upcoming games"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import random

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'])

# The Odds API configuration
ODDS_API_KEY = os.environ.get('ODDS_API_KEY', 'demo_key')
ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

# Sport season calendars with automatic date-based detection
SPORT_CALENDARS = {
    'nfl': {
        'key': 'americanfootball_nfl', 
        'name': 'NFL',
        'regular_season': {'start': (9, 5), 'end': (1, 15)},  # Sep 5 - Jan 15
        'playoffs': {'start': (1, 15), 'end': (2, 15)},       # Jan 15 - Feb 15
        'preseason': {'start': (8, 1), 'end': (9, 5)},        # Aug 1 - Sep 5
        'offseason': {'start': (2, 15), 'end': (8, 1)}        # Feb 15 - Aug 1
    },
    'nba': {
        'key': 'basketball_nba', 
        'name': 'NBA',
        'regular_season': {'start': (10, 15), 'end': (4, 15)}, # Oct 15 - Apr 15
        'playoffs': {'start': (4, 15), 'end': (6, 20)},        # Apr 15 - Jun 20
        'preseason': {'start': (10, 1), 'end': (10, 15)},      # Oct 1 - Oct 15
        'offseason': {'start': (6, 20), 'end': (10, 1)}        # Jun 20 - Oct 1
    },
    'wnba': {
        'key': 'basketball_wnba', 
        'name': 'WNBA',
        'regular_season': {'start': (5, 15), 'end': (9, 15)},  # May 15 - Sep 15
        'playoffs': {'start': (9, 15), 'end': (10, 15)},       # Sep 15 - Oct 15
        'preseason': {'start': (5, 1), 'end': (5, 15)},        # May 1 - May 15
        'offseason': {'start': (10, 15), 'end': (5, 1)}        # Oct 15 - May 1
    },
    'mlb': {
        'key': 'baseball_mlb', 
        'name': 'MLB',
        'regular_season': {'start': (3, 28), 'end': (10, 1)},  # Mar 28 - Oct 1
        'playoffs': {'start': (10, 1), 'end': (11, 1)},        # Oct 1 - Nov 1
        'preseason': {'start': (2, 15), 'end': (3, 28)},       # Feb 15 - Mar 28
        'offseason': {'start': (11, 1), 'end': (2, 15)}        # Nov 1 - Feb 15
    },
    'nhl': {
        'key': 'icehockey_nhl', 
        'name': 'NHL',
        'regular_season': {'start': (10, 10), 'end': (4, 20)}, # Oct 10 - Apr 20
        'playoffs': {'start': (4, 20), 'end': (6, 30)},        # Apr 20 - Jun 30
        'preseason': {'start': (9, 15), 'end': (10, 10)},      # Sep 15 - Oct 10
        'offseason': {'start': (6, 30), 'end': (9, 15)}        # Jun 30 - Sep 15
    },
    'ncaaf': {
        'key': 'americanfootball_ncaaf', 
        'name': 'College Football',
        'regular_season': {'start': (8, 25), 'end': (12, 10)}, # Aug 25 - Dec 10
        'playoffs': {'start': (12, 10), 'end': (1, 10)},       # Dec 10 - Jan 10
        'preseason': {'start': (8, 1), 'end': (8, 25)},        # Aug 1 - Aug 25
        'offseason': {'start': (1, 10), 'end': (8, 1)}         # Jan 10 - Aug 1
    },
    'ncaab': {
        'key': 'basketball_ncaab', 
        'name': 'College Basketball',
        'regular_season': {'start': (11, 1), 'end': (3, 10)},  # Nov 1 - Mar 10
        'playoffs': {'start': (3, 10), 'end': (4, 10)},        # Mar 10 - Apr 10 (March Madness)
        'preseason': {'start': (10, 15), 'end': (11, 1)},      # Oct 15 - Nov 1
        'offseason': {'start': (4, 10), 'end': (10, 15)}       # Apr 10 - Oct 15
    },
    'soccer': {
        'key': 'soccer_epl', 
        'name': 'Premier League',
        'regular_season': {'start': (8, 15), 'end': (5, 25)},  # Aug 15 - May 25
        'playoffs': {'start': (5, 25), 'end': (6, 10)},        # May 25 - Jun 10
        'preseason': {'start': (7, 15), 'end': (8, 15)},       # Jul 15 - Aug 15
        'offseason': {'start': (6, 10), 'end': (7, 15)}        # Jun 10 - Jul 15
    },
    'mma': {
        'key': 'mma_mixed_martial_arts', 
        'name': 'MMA/UFC',
        'regular_season': {'start': (1, 1), 'end': (12, 31)},  # Year-round
        'playoffs': {'start': (1, 1), 'end': (1, 1)},          # No traditional playoffs
        'preseason': {'start': (1, 1), 'end': (1, 1)},         # No preseason
        'offseason': {'start': (1, 1), 'end': (1, 1)}          # No offseason
    },
    'tennis': {
        'key': 'tennis_atp', 
        'name': 'Tennis ATP',
        'regular_season': {'start': (1, 1), 'end': (11, 15)},  # Jan 1 - Nov 15
        'playoffs': {'start': (11, 15), 'end': (11, 30)},      # Nov 15 - Nov 30 (ATP Finals)
        'preseason': {'start': (12, 15), 'end': (1, 1)},       # Dec 15 - Jan 1
        'offseason': {'start': (11, 30), 'end': (12, 15)}      # Nov 30 - Dec 15
    },
    'golf': {
        'key': 'golf_pga_championship', 
        'name': 'PGA Golf',
        'regular_season': {'start': (1, 1), 'end': (12, 31)},  # Year-round
        'playoffs': {'start': (8, 15), 'end': (9, 15)},        # Aug 15 - Sep 15 (FedEx Cup)
        'preseason': {'start': (1, 1), 'end': (1, 1)},         # No traditional preseason
        'offseason': {'start': (1, 1), 'end': (1, 1)}          # No traditional offseason
    }
}

# Dynamic season status detection
def get_current_season_status(sport_key, current_date=None):
    """Automatically determine current season status based on date"""
    if current_date is None:
        current_date = datetime.utcnow()
    
    if sport_key not in SPORT_CALENDARS:
        return 'active'  # Default to active for unknown sports
    
    calendar = SPORT_CALENDARS[sport_key]
    current_month = current_date.month
    current_day = current_date.day
    
    # Check each season period
    for season_type in ['regular_season', 'playoffs', 'preseason', 'offseason']:
        if season_type not in calendar:
            continue
            
        start_month, start_day = calendar[season_type]['start']
        end_month, end_day = calendar[season_type]['end']
        
        # Handle seasons that cross year boundaries
        if start_month <= end_month:
            # Same calendar year (e.g., May to September)
            if (current_month > start_month or (current_month == start_month and current_day >= start_day)) and \
               (current_month < end_month or (current_month == end_month and current_day <= end_day)):
                return 'active' if season_type in ['regular_season', 'playoffs'] else season_type
        else:
            # Crosses year boundary (e.g., October to April)
            if (current_month > start_month or (current_month == start_month and current_day >= start_day)) or \
               (current_month < end_month or (current_month == end_month and current_day <= end_day)):
                return 'active' if season_type in ['regular_season', 'playoffs'] else season_type
    
    return 'active'  # Default fallback

# Generate AVAILABLE_SPORTS with dynamic season detection
def get_available_sports():
    """Generate sports list with current season status"""
    sports = {}
    for sport_key, calendar in SPORT_CALENDARS.items():
        current_status = get_current_season_status(sport_key)
        sports[sport_key] = {
            'key': calendar['key'],
            'name': calendar['name'],
            'season': current_status,
            'last_updated': datetime.utcnow().isoformat()
        }
    return sports

# Initialize with current season statuses
AVAILABLE_SPORTS = get_available_sports()

# Generate future/prop bets for out-of-season sports
def generate_prop_bets(sport_key, season_status):
    """Generate prop bets for out-of-season or preseason sports"""
    
    prop_bet_data = {
        'nfl': {
            'next_season': '2025-26 NFL Season',
            'categories': [
                {
                    'title': 'Super Bowl LX Winner',
                    'description': 'Which team will win Super Bowl LX?',
                    'bets': [
                        {'team': 'Kansas City Chiefs', 'odds': '+450'},
                        {'team': 'Buffalo Bills', 'odds': '+650'},
                        {'team': 'San Francisco 49ers', 'odds': '+800'},
                        {'team': 'Philadelphia Eagles', 'odds': '+900'},
                        {'team': 'Cincinnati Bengals', 'odds': '+1200'},
                        {'team': 'Dallas Cowboys', 'odds': '+1400'}
                    ]
                },
                {
                    'title': 'AFC Championship Winner',
                    'description': 'Which team will win the AFC Championship?',
                    'bets': [
                        {'team': 'Kansas City Chiefs', 'odds': '+200'},
                        {'team': 'Buffalo Bills', 'odds': '+300'},
                        {'team': 'Cincinnati Bengals', 'odds': '+600'},
                        {'team': 'Miami Dolphins', 'odds': '+800'},
                        {'team': 'New York Jets', 'odds': '+1000'}
                    ]
                },
                {
                    'title': 'MVP Award Winner',
                    'description': 'Who will win NFL MVP?',
                    'bets': [
                        {'team': 'Patrick Mahomes (KC)', 'odds': '+400'},
                        {'team': 'Josh Allen (BUF)', 'odds': '+500'},
                        {'team': 'Joe Burrow (CIN)', 'odds': '+700'},
                        {'team': 'Lamar Jackson (BAL)', 'odds': '+900'},
                        {'team': 'Aaron Rodgers (NYJ)', 'odds': '+1200'}
                    ]
                }
            ]
        },
        'nba': {
            'next_season': '2025-26 NBA Season',
            'categories': [
                {
                    'title': 'NBA Championship Winner',
                    'description': 'Which team will win the 2026 NBA Championship?',
                    'bets': [
                        {'team': 'Boston Celtics', 'odds': '+350'},
                        {'team': 'Denver Nuggets', 'odds': '+450'},
                        {'team': 'Phoenix Suns', 'odds': '+600'},
                        {'team': 'Milwaukee Bucks', 'odds': '+750'},
                        {'team': 'Golden State Warriors', 'odds': '+900'},
                        {'team': 'Miami Heat', 'odds': '+1100'}
                    ]
                },
                {
                    'title': 'MVP Award Winner',
                    'description': 'Who will win NBA MVP?',
                    'bets': [
                        {'team': 'Nikola Jokic (DEN)', 'odds': '+400'},
                        {'team': 'Giannis Antetokounmpo (MIL)', 'odds': '+500'},
                        {'team': 'Jayson Tatum (BOS)', 'odds': '+600'},
                        {'team': 'Luka Doncic (DAL)', 'odds': '+700'},
                        {'team': 'Stephen Curry (GSW)', 'odds': '+900'}
                    ]
                },
                {
                    'title': 'Regular Season Wins',
                    'description': 'Team to have most regular season wins',
                    'bets': [
                        {'team': 'Boston Celtics', 'odds': '+300'},
                        {'team': 'Denver Nuggets', 'odds': '+400'},
                        {'team': 'Phoenix Suns', 'odds': '+500'},
                        {'team': 'Milwaukee Bucks', 'odds': '+600'}
                    ]
                }
            ]
        },
        'nhl': {
            'next_season': '2025-26 NHL Season',
            'categories': [
                {
                    'title': 'Stanley Cup Winner',
                    'description': 'Which team will win the Stanley Cup?',
                    'bets': [
                        {'team': 'Colorado Avalanche', 'odds': '+650'},
                        {'team': 'Edmonton Oilers', 'odds': '+750'},
                        {'team': 'Toronto Maple Leafs', 'odds': '+800'},
                        {'team': 'Boston Bruins', 'odds': '+900'},
                        {'team': 'Tampa Bay Lightning', 'odds': '+1000'},
                        {'team': 'Vegas Golden Knights', 'odds': '+1100'}
                    ]
                },
                {
                    'title': 'Hart Trophy Winner (MVP)',
                    'description': 'Who will win the Hart Trophy?',
                    'bets': [
                        {'team': 'Connor McDavid (EDM)', 'odds': '+300'},
                        {'team': 'Nathan MacKinnon (COL)', 'odds': '+450'},
                        {'team': 'Auston Matthews (TOR)', 'odds': '+600'},
                        {'team': 'David Pastrnak (BOS)', 'odds': '+800'},
                        {'team': 'Leon Draisaitl (EDM)', 'odds': '+1000'}
                    ]
                }
            ]
        },
        'ncaab': {
            'next_season': '2025-26 College Basketball Season',
            'categories': [
                {
                    'title': 'March Madness Champion',
                    'description': 'Which team will win the NCAA Tournament?',
                    'bets': [
                        {'team': 'Duke Blue Devils', 'odds': '+800'},
                        {'team': 'North Carolina Tar Heels', 'odds': '+900'},
                        {'team': 'Kansas Jayhawks', 'odds': '+1000'},
                        {'team': 'Kentucky Wildcats', 'odds': '+1100'},
                        {'team': 'Gonzaga Bulldogs', 'odds': '+1200'},
                        {'team': 'UCLA Bruins', 'odds': '+1300'}
                    ]
                },
                {
                    'title': 'Final Four Appearance',
                    'description': 'Which teams will make the Final Four?',
                    'bets': [
                        {'team': 'Duke Blue Devils', 'odds': '+300'},
                        {'team': 'North Carolina Tar Heels', 'odds': '+350'},
                        {'team': 'Kansas Jayhawks', 'odds': '+400'},
                        {'team': 'Kentucky Wildcats', 'odds': '+450'}
                    ]
                }
            ]
        }
    }
    
    default_props = {
        'next_season': f'{sport_key.upper()} 2025-26 Season',
        'categories': [
            {
                'title': f'{sport_key.upper()} Championship',
                'description': f'Future bets available for {sport_key.upper()}',
                'bets': [
                    {'team': 'Team A', 'odds': '+500'},
                    {'team': 'Team B', 'odds': '+600'},
                    {'team': 'Team C', 'odds': '+700'}
                ]
            }
        ]
    }
    
    return prop_bet_data.get(sport_key, default_props)

# Helper function for season status messages (now includes prop bets)
def get_season_message(sport_name, season_status):
    """Generate professional season status messages"""
    messages = {
        'offseason': {
            'title': f'{sport_name} Future Bets Available',
            'description': f'The {sport_name} season has concluded, but you can bet on next season\'s outcomes!',
            'action': 'Place your bets now on championship winners, MVP awards, and season predictions.'
        },
        'preseason': {
            'title': f'{sport_name} Season & Future Bets',
            'description': f'The {sport_name} regular season is approaching. Get the best odds on season outcomes!',
            'action': 'Bet on championship winners, individual awards, and team performance before the season starts.'
        }
    }
    
    return messages.get(season_status, {
        'title': f'{sport_name} season status unavailable',
        'description': 'We\'re updating our schedule information for this sport.',
        'action': 'Please check back shortly for the latest game information.'
    })

# Generate comprehensive mock data for all sports
def generate_mock_games(sport_key, count=5):
    """Generate mock games for any sport"""
    
    # Sport-specific teams and data
    teams_data = {
        'nfl': {
            'teams': [
                'Kansas City Chiefs', 'Buffalo Bills', 'Cincinnati Bengals', 'Philadelphia Eagles',
                'San Francisco 49ers', 'Dallas Cowboys', 'Miami Dolphins', 'Baltimore Ravens',
                'Los Angeles Chargers', 'New York Jets', 'Green Bay Packers', 'Minnesota Vikings',
                'Atlanta Falcons', 'New Orleans Saints', 'Tampa Bay Buccaneers', 'Carolina Panthers'
            ],
            'typical_total': 47.5
        },
        'nba': {
            'teams': [
                'Boston Celtics', 'Milwaukee Bucks', 'Philadelphia 76ers', 'Miami Heat',
                'New York Knicks', 'Brooklyn Nets', 'Cleveland Cavaliers', 'Atlanta Hawks',
                'Denver Nuggets', 'Phoenix Suns', 'Memphis Grizzlies', 'Golden State Warriors',
                'Los Angeles Lakers', 'Los Angeles Clippers', 'Sacramento Kings', 'Portland Trail Blazers'
            ],
            'typical_total': 225.5
        },
        'wnba': {
            'teams': [
                'Las Vegas Aces', 'New York Liberty', 'Connecticut Sun', 'Seattle Storm',
                'Phoenix Mercury', 'Chicago Sky', 'Washington Mystics', 'Atlanta Dream',
                'Minnesota Lynx', 'Indiana Fever', 'Dallas Wings', 'Los Angeles Sparks'
            ],
            'typical_total': 165.5
        },
        'mlb': {
            'teams': [
                'Los Angeles Dodgers', 'Atlanta Braves', 'Houston Astros', 'New York Yankees',
                'Philadelphia Phillies', 'San Diego Padres', 'Toronto Blue Jays', 'Seattle Mariners',
                'Baltimore Orioles', 'Texas Rangers', 'Arizona Diamondbacks', 'Miami Marlins',
                'Tampa Bay Rays', 'Milwaukee Brewers', 'Chicago Cubs', 'St. Louis Cardinals'
            ],
            'typical_total': 8.5
        },
        'ncaab': {
            'teams': [
                'Duke Blue Devils', 'North Carolina Tar Heels', 'Kansas Jayhawks', 'Kentucky Wildcats', 
                'Gonzaga Bulldogs', 'UCLA Bruins', 'Villanova Wildcats', 'Michigan State Spartans',
                'Arizona Wildcats', 'Tennessee Volunteers', 'Auburn Tigers', 'Houston Cougars',
                'Purdue Boilermakers', 'Illinois Fighting Illini', 'Wisconsin Badgers', 'Iowa Hawkeyes'
            ],
            'typical_total': 145.5
        },
        'soccer': {
            'teams': [
                'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea',
                'Manchester United', 'Newcastle United', 'Tottenham Hotspur', 'Brighton',
                'Aston Villa', 'West Ham United', 'Crystal Palace', 'Brentford',
                'Fulham', 'Wolves', 'Everton', 'Nottingham Forest'
            ],
            'typical_total': 2.5
        },
        'mma': {
            'teams': [
                'Jon Jones', 'Islam Makhachev', 'Leon Edwards', 'Alexander Volkanovski',
                'Aljamain Sterling', 'Israel Adesanya', 'Kamaru Usman', 'Francis Ngannou',
                'Dustin Poirier', 'Charles Oliveira', 'Conor McGregor', 'Jorge Masvidal',
                'Colby Covington', 'Gilbert Burns', 'Robert Whittaker', 'Paulo Costa'
            ],
            'typical_total': 2.5
        }
    }
    
    # Default teams if sport not specifically defined
    default_teams = [f'{sport_key.upper()} Team {i+1}' for i in range(16)]
    sport_teams = teams_data.get(sport_key, {'teams': default_teams, 'typical_total': 50.5})
    
    games = []
    base_time = datetime.utcnow()
    
    for i in range(count):
        # Generate random matchup
        available_teams = sport_teams['teams'].copy()
        home_team = random.choice(available_teams)
        available_teams.remove(home_team)
        away_team = random.choice(available_teams)
        
        # Generate realistic game times based on sport scheduling
        sport_schedule = {
            'nfl': {'days': [0, 3, 6], 'hours': [13, 16, 20]},  # Sun, Thu, Sun at 1PM, 4PM, 8PM EST
            'nba': {'days': [0, 1, 2, 3, 4, 5, 6], 'hours': [19, 20, 21, 22]},  # Every day, 7-10PM EST
            'wnba': {'days': [1, 2, 4, 5, 6], 'hours': [19, 20, 21]},  # Tue, Wed, Fri, Sat, Sun 7-9PM EST
            'mlb': {'days': [0, 1, 2, 3, 4, 5, 6], 'hours': [13, 19, 20]},  # Every day, 1PM, 7PM, 8PM EST
            'ncaab': {'days': [1, 2, 5, 6], 'hours': [18, 19, 20, 21]},  # Tue, Wed, Sat, Sun 6-9PM EST
            'soccer': {'days': [5, 6], 'hours': [10, 12, 14]},  # Sat, Sun 10AM, 12PM, 2PM EST
            'mma': {'days': [5], 'hours': [22]},  # Saturday 10PM EST
            'default': {'days': [0, 1, 2, 3, 4, 5, 6], 'hours': [19, 20, 21]}
        }
        
        schedule = sport_schedule.get(sport_key, sport_schedule['default'])
        
        # Pick a random day within next 7 days that matches sport schedule
        days_ahead = random.choice([d for d in range(8) if (base_time + timedelta(days=d)).weekday() in schedule['days']])
        game_hour = random.choice(schedule['hours'])
        
        # Create game time with realistic scheduling
        game_date = base_time + timedelta(days=days_ahead)
        game_time = game_date.replace(hour=game_hour, minute=random.choice([0, 30]), second=0, microsecond=0)
        
        # Generate realistic odds
        home_favorite = random.choice([True, False])
        if home_favorite:
            home_ml = random.randint(-200, -105)
            away_ml = random.randint(105, 190)
            home_spread = random.uniform(-7.5, -1.5)
            away_spread = -home_spread
        else:
            home_ml = random.randint(105, 190) 
            away_ml = random.randint(-200, -105)
            home_spread = random.uniform(1.5, 7.5)
            away_spread = -home_spread
        
        # Generate totals
        total_line = sport_teams['typical_total'] + random.uniform(-5, 5)
        
        # Generate sportsbook odds with slight variations  
        sportsbooks = {}
        books = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers', 'espnbet']
        
        # Daily fantasy sports platforms with over/under bets
        fantasy_books = ['prizepicks', 'underdog', 'parlayplay', 'superdraft']
        
        for book in books:
            # Add slight variations to odds across books
            variation = random.randint(-5, 5)
            book_home_ml = max(-300, min(-100, home_ml + variation)) if home_ml < 0 else max(100, home_ml + variation)
            book_away_ml = max(-300, min(-100, away_ml - variation)) if away_ml < 0 else max(100, away_ml - variation)
            
            sportsbooks[book] = {
                'moneyline': {
                    'home': book_home_ml,
                    'away': book_away_ml
                },
                'spread': {
                    'home': {
                        'price': random.choice([-110, -105, -115, -108, -112]),
                        'point': round(home_spread + random.uniform(-0.5, 0.5), 1)
                    },
                    'away': {
                        'price': random.choice([-110, -105, -115, -108, -112]), 
                        'point': round(away_spread + random.uniform(-0.5, 0.5), 1)
                    }
                },
                'total': {
                    'over': {
                        'price': random.choice([-110, -105, -115, -108, -112]),
                        'point': round(total_line + random.uniform(-0.5, 0.5), 1)
                    },
                    'under': {
                        'price': random.choice([-110, -105, -115, -108, -112]),
                        'point': round(total_line + random.uniform(-0.5, 0.5), 1)
                    }
                }
            }
        
        # Add daily fantasy sports with player props and over/under bets
        for fantasy_book in fantasy_books:
            # Generate player prop bets for fantasy platforms
            player_props = []
            
            # Sport-specific player props
            if sport_key == 'nfl':
                props = [
                    {'player': 'Patrick Mahomes', 'stat': 'Passing Yards', 'line': 285.5, 'more_odds': '-110', 'less_odds': '-110'},
                    {'player': 'Derrick Henry', 'stat': 'Rushing Yards', 'line': 95.5, 'more_odds': '-105', 'less_odds': '-115'},
                    {'player': 'Travis Kelce', 'stat': 'Receiving Yards', 'line': 75.5, 'more_odds': '-115', 'less_odds': '-105'},
                    {'player': 'Josh Allen', 'stat': 'Passing TDs', 'line': 1.5, 'more_odds': '+100', 'less_odds': '-120'}
                ]
            elif sport_key == 'nba':
                props = [
                    {'player': 'LeBron James', 'stat': 'Points', 'line': 25.5, 'more_odds': '-110', 'less_odds': '-110'},
                    {'player': 'Nikola Jokic', 'stat': 'Rebounds', 'line': 11.5, 'more_odds': '-105', 'less_odds': '-115'},
                    {'player': 'Stephen Curry', 'stat': 'Assists', 'line': 6.5, 'more_odds': '-115', 'less_odds': '-105'},
                    {'player': 'Giannis Antetokounmpo', 'stat': 'Points + Rebounds', 'line': 37.5, 'more_odds': '+105', 'less_odds': '-125'}
                ]
            elif sport_key == 'wnba':
                props = [
                    {'player': "A'ja Wilson", 'stat': 'Points', 'line': 22.5, 'more_odds': '-110', 'less_odds': '-110'},
                    {'player': 'Breanna Stewart', 'stat': 'Rebounds', 'line': 8.5, 'more_odds': '-105', 'less_odds': '-115'},
                    {'player': 'Sabrina Ionescu', 'stat': 'Assists', 'line': 5.5, 'more_odds': '-115', 'less_odds': '-105'}
                ]
            elif sport_key == 'mlb':
                props = [
                    {'player': 'Shohei Ohtani', 'stat': 'Hits', 'line': 1.5, 'more_odds': '+110', 'less_odds': '-130'},
                    {'player': 'Aaron Judge', 'stat': 'Home Runs', 'line': 0.5, 'more_odds': '+180', 'less_odds': '-220'},
                    {'player': 'Mookie Betts', 'stat': 'Total Bases', 'line': 2.5, 'more_odds': '-105', 'less_odds': '-115'}
                ]
            else:
                # Default props for other sports
                props = [
                    {'player': 'Star Player', 'stat': 'Fantasy Points', 'line': 25.5, 'more_odds': '-110', 'less_odds': '-110'},
                    {'player': 'Key Player', 'stat': 'Performance Score', 'line': 15.5, 'more_odds': '-105', 'less_odds': '-115'}
                ]
            
            sportsbooks[fantasy_book] = {
                'type': 'daily_fantasy',
                'platform_name': fantasy_book.title(),
                'player_props': props,
                'game_total': {
                    'over': {'price': '-110', 'point': round(total_line, 1)},
                    'under': {'price': '-110', 'point': round(total_line, 1)}
                }
            }
        
        games.append({
            'id': f'{sport_key}_game_{i+1}',
            'sport': sport_key,
            'home_team': home_team,
            'away_team': away_team,
            'commence_time': game_time.isoformat() + 'Z',
            'status': 'scheduled' if game_time > base_time + timedelta(hours=1) else 'live',
            'sportsbooks': sportsbooks
        })
    
    return games

# Refresh season statuses (can be called periodically)
def refresh_season_statuses():
    """Refresh all sports season statuses based on current date"""
    global AVAILABLE_SPORTS
    AVAILABLE_SPORTS = get_available_sports()
    return AVAILABLE_SPORTS

@app.route('/')
def home():
    # Refresh season statuses on each request to root
    refresh_season_statuses()
    
    return jsonify({
        'message': 'SmartBets 2.0 Comprehensive Live Odds API',
        'status': 'success',
        'api_key_configured': bool(ODDS_API_KEY and ODDS_API_KEY != 'demo_key'),
        'available_sports': list(AVAILABLE_SPORTS.keys()),
        'total_sports': len(AVAILABLE_SPORTS),
        'season_statuses': {sport: info['season'] for sport, info in AVAILABLE_SPORTS.items()},
        'features': ['live_games', 'upcoming_games', 'comprehensive_odds', 'all_sports', 'auto_season_detection'],
        'endpoints': [
            '/api/odds/sports',
            '/api/odds/live/{sport}',
            '/api/odds/upcoming/{sport}',
            '/api/odds/all-games',
            '/api/odds/best',
            '/api/odds/comparison/{sport}',
            '/api/season/status',
            '/api/season/refresh'
        ],
        'last_season_update': datetime.utcnow().isoformat()
    })

@app.route('/api/season/status', methods=['GET'])
def get_season_statuses():
    """Get current season status for all sports"""
    try:
        # Refresh statuses
        current_statuses = refresh_season_statuses()
        
        detailed_statuses = {}
        current_date = datetime.utcnow()
        
        for sport_key, sport_info in current_statuses.items():
            calendar = SPORT_CALENDARS[sport_key]
            status = sport_info['season']
            
            # Get next season change
            next_change = get_next_season_change(sport_key, current_date)
            
            detailed_statuses[sport_key] = {
                'name': sport_info['name'],
                'current_status': status,
                'next_change': next_change,
                'last_updated': sport_info['last_updated']
            }
        
        return jsonify({
            'success': True,
            'current_date': current_date.isoformat(),
            'sports': detailed_statuses,
            'total_sports': len(detailed_statuses),
            'auto_detection': True
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get season statuses: {str(e)}'}), 500

def get_next_season_change(sport_key, current_date):
    """Get the next season change date for a sport"""
    if sport_key not in SPORT_CALENDARS:
        return None
    
    calendar = SPORT_CALENDARS[sport_key]
    current_month = current_date.month
    current_day = current_date.day
    current_year = current_date.year
    
    # Find the next season transition
    next_changes = []
    
    for season_type in ['regular_season', 'playoffs', 'preseason', 'offseason']:
        if season_type not in calendar:
            continue
            
        start_month, start_day = calendar[season_type]['start']
        
        # Calculate next occurrence of this date
        if start_month > current_month or (start_month == current_month and start_day > current_day):
            next_date = datetime(current_year, start_month, start_day)
        else:
            next_date = datetime(current_year + 1, start_month, start_day)
        
        next_changes.append({
            'date': next_date,
            'season': 'active' if season_type in ['regular_season', 'playoffs'] else season_type,
            'season_type': season_type
        })
    
    # Return the earliest next change
    if next_changes:
        next_change = min(next_changes, key=lambda x: x['date'])
        return {
            'date': next_change['date'].isoformat(),
            'season': next_change['season'],
            'season_type': next_change['season_type'],
            'days_until': (next_change['date'] - current_date).days
        }
    
    return None

@app.route('/api/season/refresh', methods=['POST'])
def refresh_season_status_endpoint():
    """Manually refresh season statuses (useful for testing or scheduled updates)"""
    try:
        updated_statuses = refresh_season_statuses()
        
        return jsonify({
            'success': True,
            'message': 'Season statuses refreshed successfully',
            'updated_sports': len(updated_statuses),
            'statuses': {sport: info['season'] for sport, info in updated_statuses.items()},
            'refresh_time': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to refresh season statuses: {str(e)}'}), 500

@app.route('/api/season/simulate/<date>', methods=['GET'])
def simulate_season_status(date):
    """Simulate season statuses for a specific date (YYYY-MM-DD format)"""
    try:
        # Parse the provided date
        try:
            test_date = datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        simulated_statuses = {}
        
        for sport_key, calendar in SPORT_CALENDARS.items():
            status = get_current_season_status(sport_key, test_date)
            next_change = get_next_season_change(sport_key, test_date)
            
            simulated_statuses[sport_key] = {
                'name': calendar['name'],
                'current_status': status,
                'next_change': next_change
            }
        
        return jsonify({
            'success': True,
            'simulation_date': test_date.isoformat(),
            'message': f'Season statuses simulated for {date}',
            'sports': simulated_statuses,
            'note': 'This is a simulation - actual API still uses real current date'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to simulate season statuses: {str(e)}'}), 500

@app.route('/api/odds/sports', methods=['GET'])
def get_supported_sports():
    """Get comprehensive list of supported sports"""
    try:
        sports_list = []
        for key, info in AVAILABLE_SPORTS.items():
            sports_list.append({
                'key': key,
                'name': info['name'],
                'active': info['season'] == 'active',
                'season_status': info['season'],
                'has_live_games': True,
                'has_upcoming_games': True
            })
        
        return jsonify({
            'success': True,
            'sports': sports_list,
            'total_count': len(sports_list),
            'active_sports': len([s for s in sports_list if s['active']]),
            'data_source': 'comprehensive_coverage'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch sports: {str(e)}'}), 500

@app.route('/api/odds/live/<sport>', methods=['GET'])
def get_live_odds(sport):
    """Get live odds for a specific sport"""
    try:
        if sport.lower() not in SPORT_CALENDARS:
            return jsonify({'error': f'Unsupported sport: {sport}'}), 400
        
        # Get real-time season status
        season_status = get_current_season_status(sport.lower())
        sport_info = SPORT_CALENDARS[sport.lower()]
        
        # Check if sport is out of season - show prop bets instead
        if season_status in ['offseason', 'preseason']:
            prop_bets = generate_prop_bets(sport.lower(), season_status)
            return jsonify({
                'success': True,
                'sport': sport_info['name'],
                'sport_key': sport.lower(),
                'games': [],
                'total_games': 0,
                'season_status': season_status,
                'season_message': get_season_message(sport_info['name'], season_status),
                'prop_bets': prop_bets,
                'has_prop_bets': True,
                'data_source': 'future_bets_available',
                'last_updated': datetime.utcnow().isoformat()
            })
        
        limit = request.args.get('limit', 10, type=int)
        
        # Generate comprehensive mock data
        games = generate_mock_games(sport.lower(), min(limit, 10))
        
        # Sort games chronologically from soonest to latest
        games.sort(key=lambda x: x['commence_time'])
        
        # Filter to show only live/starting soon games
        live_games = [g for g in games if g['status'] == 'live' or 
                     datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                     datetime.utcnow() + timedelta(hours=3)]
        
        return jsonify({
            'success': True,
            'sport': sport_info['name'],
            'sport_key': sport.lower(),
            'games': live_games,
            'total_games': len(live_games),
            'data_source': 'comprehensive_mock_data',
            'last_updated': datetime.utcnow().isoformat(),
            'season_status': season_status
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch live odds: {str(e)}'}), 500

@app.route('/api/odds/upcoming/<sport>', methods=['GET'])
def get_upcoming_games(sport):
    """Get upcoming games for a specific sport"""
    try:
        if sport.lower() not in AVAILABLE_SPORTS:
            return jsonify({'error': f'Unsupported sport: {sport}'}), 400
        
        days_ahead = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Generate games for upcoming days
        all_games = generate_mock_games(sport.lower(), min(limit, 25))
        
        # Filter for upcoming games (not live/starting soon)
        cutoff_time = datetime.utcnow() + timedelta(hours=3)
        upcoming_games = [g for g in all_games if 
                         datetime.fromisoformat(g['commence_time'].replace('Z', '')) > cutoff_time and
                         datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                         datetime.utcnow() + timedelta(days=days_ahead)]
        
        # Sort by game time
        upcoming_games.sort(key=lambda x: x['commence_time'])
        
        return jsonify({
            'success': True,
            'sport': AVAILABLE_SPORTS[sport.lower()]['name'],
            'sport_key': sport.lower(),
            'games': upcoming_games,
            'total_upcoming': len(upcoming_games),
            'days_ahead': days_ahead,
            'data_source': 'comprehensive_schedule',
            'last_updated': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch upcoming games: {str(e)}'}), 500

@app.route('/api/odds/all-games', methods=['GET'])
def get_all_games():
    """Get games from all sports combined"""
    try:
        limit_per_sport = request.args.get('per_sport', 3, type=int)
        show_upcoming = request.args.get('upcoming', 'true').lower() == 'true'
        
        # Validate parameters
        if limit_per_sport < 1 or limit_per_sport > 50:
            limit_per_sport = 3
        
        all_games = []
        sports_summary = {}
        
        for sport_key, sport_info in AVAILABLE_SPORTS.items():
            try:
                if sport_info['season'] != 'active':
                    continue  # Skip inactive seasons
                    
                games = generate_mock_games(sport_key, limit_per_sport)
                
                if not show_upcoming:
                    # Filter to live games only
                    games = [g for g in games if g['status'] == 'live' or 
                            datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                            datetime.utcnow() + timedelta(hours=3)]
                
                all_games.extend(games)
                sports_summary[sport_key] = {
                    'name': sport_info['name'],
                    'games_count': len(games),
                    'season_status': sport_info['season']
                }
            except Exception as sport_error:
                print(f"Error processing sport {sport_key}: {str(sport_error)}")
                continue
        
        # Sort all games by start time
        if all_games:
            all_games.sort(key=lambda x: x.get('commence_time', ''))
        
        return jsonify({
            'success': True,
            'games': all_games,
            'total_games': len(all_games),
            'sports_included': len(sports_summary),
            'sports_summary': sports_summary,
            'show_upcoming': show_upcoming,
            'data_source': 'all_sports_combined',
            'last_updated': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"All games endpoint error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch all games: {str(e)}',
            'games': [],
            'total_games': 0
        }), 500

@app.route('/api/odds/comparison/<sport>', methods=['GET'])
def get_odds_comparison(sport):
    """Get comprehensive odds comparison for a sport"""
    try:
        if sport.lower() not in SPORT_CALENDARS:
            return jsonify({'error': f'Unsupported sport: {sport}'}), 400
        
        # Get real-time season status
        season_status = get_current_season_status(sport.lower())
        sport_info = SPORT_CALENDARS[sport.lower()]
        
        # Check if sport is out of season - show prop bets instead
        if season_status in ['offseason', 'preseason']:
            prop_bets = generate_prop_bets(sport.lower(), season_status)
            return jsonify({
                'success': True,
                'sport': sport_info['name'],
                'sport_key': sport.lower(),
                'games': [],
                'season_status': season_status,
                'season_message': get_season_message(sport_info['name'], season_status),
                'prop_bets': prop_bets,
                'has_prop_bets': True,
                'comparison_summary': {
                    'total_games': 0,
                    'prop_bet_categories': len(prop_bets.get('categories', [])),
                    'total_prop_bets': sum(len(cat.get('bets', [])) for cat in prop_bets.get('categories', [])),
                    'season_note': f'{sport_info["name"]} future bets available'
                },
                'data_source': 'future_bets_comparison',
                'last_updated': datetime.utcnow().isoformat()
            })
        
        limit = request.args.get('limit', 10, type=int)
        
        games = generate_mock_games(sport.lower(), limit)
        
        # Sort games chronologically from soonest to latest
        games.sort(key=lambda x: x['commence_time'])
        
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
            
            # Find best odds (highest positive or least negative)
            if home_odds:
                best_home = max(home_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in home_odds) else min(home_odds, key=lambda x: abs(x[1]))
                game['best_home_odds'] = {'sportsbook': best_home[0], 'odds': best_home[1]}
            
            if away_odds:
                best_away = max(away_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in away_odds) else min(away_odds, key=lambda x: abs(x[1]))
                game['best_away_odds'] = {'sportsbook': best_away[0], 'odds': best_away[1]}
            
            # Calculate potential savings
            if home_odds and len(home_odds) > 1:
                home_values = [odd[1] for odd in home_odds]
                best_home_value = max(home_values) if any(v > 0 for v in home_values) else min(home_values, key=abs)
                worst_home_value = min(home_values) if any(v > 0 for v in home_values) else max(home_values, key=abs)
                game['home_savings'] = abs(best_home_value - worst_home_value)
            
            if away_odds and len(away_odds) > 1:
                away_values = [odd[1] for odd in away_odds]
                best_away_value = max(away_values) if any(v > 0 for v in away_values) else min(away_values, key=abs)
                worst_away_value = min(away_values) if any(v > 0 for v in away_values) else max(away_values, key=abs)
                game['away_savings'] = abs(best_away_value - worst_away_value)
        
        return jsonify({
            'success': True,
            'sport': AVAILABLE_SPORTS[sport.lower()]['name'],
            'sport_key': sport.lower(),
            'games': games,
            'comparison_summary': {
                'total_games': len(games),
                'sportsbooks_compared': len(set().union(*[game['sportsbooks'].keys() for game in games])) if games else 0,
                'best_value_opportunities': sum(1 for game in games if 'best_home_odds' in game or 'best_away_odds' in game),
                'average_savings_potential': '5-15%'
            },
            'last_updated': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get comparison: {str(e)}'}), 500

@app.route('/api/odds/best', methods=['POST'])
def get_best_odds():
    """Find best odds for a specific bet"""
    try:
        data = request.get_json()
        team = data.get('team', '')
        sport = data.get('sport', 'nfl')
        bet_type = data.get('bet_type', 'moneyline')
        
        # Generate sample best odds response
        books_odds = {
            'draftkings': random.randint(-150, +150),
            'fanduel': random.randint(-150, +150),
            'betmgm': random.randint(-150, +150),
            'caesars': random.randint(-150, +150),
            'betrivers': random.randint(-150, +150)
        }
        
        best_book = max(books_odds.items(), key=lambda x: x[1])
        worst_book = min(books_odds.items(), key=lambda x: x[1])
        
        savings = abs(best_book[1] - worst_book[1])
        
        return jsonify({
            'success': True,
            'team': team,
            'sport': sport.upper(),
            'bet_type': bet_type,
            'best_odds': {
                'sportsbook': best_book[0],
                'odds': best_book[1],
                'potential_payout': abs(best_book[1]/100) * 100 if best_book[1] > 0 else 100/abs(best_book[1]) * 100
            },
            'all_sportsbooks': books_odds,
            'savings': {
                'amount': f'${savings/10:.2f}',
                'percentage': f'{(savings/abs(worst_book[1])*100):.1f}%',
                'vs_worst': worst_book[0]
            },
            'recommendation': f'Bet with {best_book[0].title()} for best value - save {(savings/abs(worst_book[1])*100):.1f}% vs worst odds',
            'deep_links': {
                best_book[0]: f'https://sportsbook.{best_book[0]}.com?ref=smartbets&team={team}&sport={sport}'
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to find best odds: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting SmartBets Comprehensive Live Odds API...")
    print(f"API Key Configured: {bool(ODDS_API_KEY and ODDS_API_KEY != 'demo_key')}")
    print("Available at: http://localhost:5005")
    print(f"Sports Coverage: {len(AVAILABLE_SPORTS)} sports")
    print("Features: Live games, Upcoming games, All sports combined")
    app.run(debug=True, host='0.0.0.0', port=5005)