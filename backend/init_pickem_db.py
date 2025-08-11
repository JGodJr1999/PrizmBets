#!/usr/bin/env python3
"""
Database initialization script for NFL Pick'em Pools
Creates the necessary tables and initial data
"""

import os
import sys
from datetime import datetime, timedelta

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.models.user import db
from app.models.pickem_pools import PickEmPool, PoolMembership, NFLWeek, NFLGame, PoolPick, WeeklyStandings
from app.services.nfl_schedule_service import NFLScheduleService

def init_pickem_database():
    """Initialize the Pick'em database tables"""
    app = create_app('development')
    
    with app.app_context():
        print("Initializing NFL Pick'em Pools database...")
        
        try:
            # Create all tables
            db.create_all()
            print("✓ Database tables created successfully")
            
            # Initialize NFL schedule service
            nfl_service = NFLScheduleService()
            
            # Create sample NFL weeks for current season
            current_season = datetime.now().year
            create_sample_nfl_weeks(current_season)
            
            # Sync NFL schedule from sports service
            print("Syncing NFL schedule from sports service...")
            result = nfl_service.sync_nfl_schedule(current_season)
            
            if result['success']:
                print(f"✓ NFL schedule synced successfully:")
                print(f"  - Weeks processed: {result['weeks_processed']}")
                print(f"  - Games created: {result['games_created']}")
                print(f"  - Games updated: {result['games_updated']}")
            else:
                print(f"⚠ NFL schedule sync failed: {result['error']}")
                print("Creating sample data instead...")
                create_sample_games()
            
            print("✓ Pick'em database initialization complete!")
            
        except Exception as e:
            print(f"✗ Error initializing database: {e}")
            raise

def create_sample_nfl_weeks(season_year):
    """Create sample NFL weeks for the season"""
    print("Creating sample NFL weeks...")
    
    # Define season start (approximate)
    season_start = datetime(season_year, 9, 7)  # First Thursday in September
    
    weeks_created = 0
    
    # Create 18 regular season weeks
    for week_num in range(1, 19):
        week_start = season_start + timedelta(weeks=week_num-1)
        pick_deadline = week_start + timedelta(days=3)  # Thursday
        week_end = week_start + timedelta(days=6)
        
        # Check if week already exists
        existing_week = NFLWeek.query.filter_by(
            week_number=week_num,
            season_year=season_year
        ).first()
        
        if not existing_week:
            week = NFLWeek(
                week_number=week_num,
                season_year=season_year,
                week_type='regular',
                start_date=week_start,
                pick_deadline=pick_deadline,
                end_date=week_end,
                is_active=(week_num == 1)  # Make week 1 active by default
            )
            db.session.add(week)
            weeks_created += 1
    
    # Create playoff weeks
    playoff_weeks = [
        (19, 'wildcard'),
        (20, 'divisional'), 
        (21, 'conference'),
        (22, 'superbowl')
    ]
    
    for week_num, week_type in playoff_weeks:
        week_start = season_start + timedelta(weeks=week_num-1)
        pick_deadline = week_start + timedelta(days=6)  # Saturday
        week_end = week_start + timedelta(days=6)
        
        existing_week = NFLWeek.query.filter_by(
            week_number=week_num,
            season_year=season_year
        ).first()
        
        if not existing_week:
            week = NFLWeek(
                week_number=week_num,
                season_year=season_year,
                week_type=week_type,
                start_date=week_start,
                pick_deadline=pick_deadline,
                end_date=week_end
            )
            db.session.add(week)
            weeks_created += 1
    
    db.session.commit()
    print(f"✓ Created {weeks_created} NFL weeks")

def create_sample_games():
    """Create sample NFL games for testing"""
    print("Creating sample NFL games...")
    
    # Get first few weeks
    weeks = NFLWeek.query.filter_by(season_year=datetime.now().year).order_by(NFLWeek.week_number).limit(3).all()
    
    sample_matchups = [
        ('Kansas City Chiefs', 'Buffalo Bills'),
        ('Philadelphia Eagles', 'Dallas Cowboys'),
        ('San Francisco 49ers', 'Green Bay Packers'),
        ('Baltimore Ravens', 'Cincinnati Bengals'),
        ('Miami Dolphins', 'New England Patriots'),
        ('Los Angeles Rams', 'Seattle Seahawks'),
        ('Minnesota Vikings', 'Detroit Lions'),
        ('Tampa Bay Buccaneers', 'New Orleans Saints'),
        ('Denver Broncos', 'Las Vegas Raiders'),
        ('Pittsburgh Steelers', 'Cleveland Browns'),
        ('Indianapolis Colts', 'Jacksonville Jaguars'),
        ('Tennessee Titans', 'Houston Texans'),
        ('Arizona Cardinals', 'Los Angeles Chargers'),
        ('Atlanta Falcons', 'Carolina Panthers'),
        ('Washington Commanders', 'New York Giants'),
        ('Chicago Bears', 'New York Jets')
    ]
    
    games_created = 0
    
    for week in weeks:
        # Create games for this week
        games_this_week = sample_matchups[:min(16, len(sample_matchups))]
        
        for i, (away_team, home_team) in enumerate(games_this_week):
            # Schedule games throughout the week (Sunday mainly)
            if i == 0:
                game_day = 3  # Thursday night
            elif i == 1:
                game_day = 0  # Monday night
            else:
                game_day = 6  # Sunday
            
            game_time = week.start_date + timedelta(days=game_day, hours=13 + (i % 3) * 3)
            
            game = NFLGame(
                week_id=week.id,
                external_game_id=f"sample_{week.week_number}_{i}",
                home_team=home_team,
                away_team=away_team,
                game_time=game_time
            )
            db.session.add(game)
            games_created += 1
    
    db.session.commit()
    print(f"✓ Created {games_created} sample games")

def create_sample_pool():
    """Create a sample pool for testing"""
    from app.models.user import User
    
    print("Creating sample pool...")
    
    # Find a user to be the creator (or create one)
    creator = User.query.first()
    if not creator:
        print("No users found. Create a user account first.")
        return
    
    # Create sample pool
    sample_pool = PickEmPool(
        name="Sample NFL Pool 2024",
        description="Test pool for NFL Pick'em functionality",
        creator_id=creator.id,
        season_year=datetime.now().year,
        settings={
            'pick_type': 'straight_up',
            'include_playoffs': True,
            'tiebreaker_method': 'head_to_head',
            'late_pick_penalty': False
        }
    )
    
    db.session.add(sample_pool)
    db.session.flush()
    
    # Add creator as member
    membership = PoolMembership(
        pool_id=sample_pool.id,
        user_id=creator.id,
        display_name=creator.name,
        is_admin=True
    )
    
    db.session.add(membership)
    db.session.commit()
    
    print(f"✓ Created sample pool: {sample_pool.name}")
    print(f"  Invite Code: {sample_pool.invite_code}")

if __name__ == '__main__':
    init_pickem_database()
    
    # Optionally create a sample pool
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--with-sample-pool':
        try:
            create_sample_pool()
        except Exception as e:
            print(f"Could not create sample pool: {e}")
    
    print("\nDatabase initialization complete!")
    print("You can now test the Pick'em API endpoints.")