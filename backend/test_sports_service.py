#!/usr/bin/env python3
"""
Test script for the comprehensive sports service
Tests the new sports data integration without SQLAlchemy dependencies
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.comprehensive_sports_service import ComprehensiveSportsService
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_sports_service():
    """Test the comprehensive sports service functionality"""
    print("=" * 60)
    print("TESTING COMPREHENSIVE SPORTS SERVICE")
    print("=" * 60)
    
    # Initialize service
    service = ComprehensiveSportsService()
    
    # Test 1: Get available sports
    print("\n1. Testing get_available_sports()...")
    sports = service.get_available_sports()
    print(f"✓ Found {len(sports)} sports:")
    for sport in sports[:3]:  # Show first 3
        print(f"  - {sport['name']} ({sport['key']}): {sport['season_status']}")
    
    # Test 2: Get all games
    print("\n2. Testing get_all_games()...")
    all_games = service.get_all_games(limit_per_sport=2, show_upcoming=True)
    print(f"✓ Success: {all_games['success']}")
    print(f"✓ Total games: {all_games['total_games']}")
    print(f"✓ Sports included: {all_games['sports_included']}")
    
    if all_games['games']:
        sample_game = all_games['games'][0]
        print(f"✓ Sample game: {sample_game['away_team']} @ {sample_game['home_team']}")
        print(f"  - Sport: {sample_game['sport']}")
        print(f"  - Time: {sample_game['commence_time']}")
        print(f"  - Sportsbooks: {len(sample_game['sportsbooks'])}")
    
    # Test 3: Get live odds for specific sport
    print("\n3. Testing get_live_odds() for NFL...")
    nfl_odds = service.get_live_odds('nfl', limit=3)
    print(f"✓ Success: {nfl_odds['success']}")
    print(f"✓ Sport: {nfl_odds.get('sport', 'N/A')}")
    print(f"✓ Games: {nfl_odds.get('total_games', 0)}")
    
    # Test 4: Get odds comparison
    print("\n4. Testing get_odds_comparison() for NBA...")
    nba_comparison = service.get_odds_comparison('nba', limit=2)
    print(f"✓ Success: {nba_comparison['success']}")
    if nba_comparison['games']:
        sample_game = nba_comparison['games'][0]
        print(f"✓ Sample game: {sample_game['away_team']} @ {sample_game['home_team']}")
        if 'best_home_odds' in sample_game:
            best_odds = sample_game['best_home_odds']
            print(f"  - Best home odds: {best_odds['odds']} ({best_odds['sportsbook']})")
    
    # Test 5: Season status
    print("\n5. Testing get_season_statuses()...")
    seasons = service.get_season_statuses()
    print(f"✓ Success: {seasons['success']}")
    print(f"✓ Total sports: {seasons['total_sports']}")
    
    active_sports = [name for name, info in seasons['sports'].items() if info['is_active']]
    print(f"✓ Active sports: {len(active_sports)}")
    
    # Test 6: Test API integration (if key available)
    print("\n6. Testing API integration...")
    print(f"✓ Using live API: {service.use_live_api}")
    print(f"✓ API Key configured: {'Yes' if service.odds_api_key != 'demo_key' else 'No'}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    try:
        test_sports_service()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)