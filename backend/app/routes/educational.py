"""
Educational Content API Routes for PrizmBets
Provides demo parlays, tutorials, and learning resources
"""

from flask import Blueprint, request, jsonify
from app.utils.auth_decorators import auth_required, get_current_user
from app.services.tier_service import TierService
import logging
import sys
import os

# Add sample content to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'sample_content'))

try:
    from demo_parlays import (
        get_demo_parlay, get_all_demo_parlays, 
        format_demo_parlay_for_api, BETTING_SCENARIOS
    )
    from tutorial_system import (
        get_tutorial, get_all_tutorials, get_tutorials_by_difficulty,
        format_tutorial_for_api, get_tutorial_progress_tracker
    )
except ImportError as e:
    logging.warning(f"Sample content not available: {e}")
    # Fallback for missing sample content
    def get_demo_parlay(): return None
    def get_all_demo_parlays(): return []
    def format_demo_parlay_for_api(p): return {}
    BETTING_SCENARIOS = []
    def get_tutorial(id): return None
    def get_all_tutorials(): return []
    def get_tutorials_by_difficulty(d): return []
    def format_tutorial_for_api(t): return {}
    def get_tutorial_progress_tracker(): return {}

educational_bp = Blueprint('educational', __name__, url_prefix='/api/education')
logger = logging.getLogger(__name__)

@educational_bp.route('/demo-parlays', methods=['GET'])
def get_demo_parlays():
    """Get all demo parlay examples"""
    try:
        demo_parlays = get_all_demo_parlays()
        
        if not demo_parlays:
            return jsonify({
                'message': 'Demo parlays not available',
                'count': 0,
                'parlays': []
            }), 200
        
        formatted_parlays = [format_demo_parlay_for_api(parlay) for parlay in demo_parlays]
        
        return jsonify({
            'message': 'Demo parlays retrieved successfully',
            'count': len(formatted_parlays),
            'parlays': formatted_parlays,
            'usage_note': 'These are sample analyses for educational purposes only'
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving demo parlays: {str(e)}")
        return jsonify({'error': 'Unable to retrieve demo parlays'}), 500

@educational_bp.route('/demo-parlays/<int:parlay_id>', methods=['GET'])
def get_specific_demo_parlay(parlay_id):
    """Get a specific demo parlay by ID"""
    try:
        demo_parlay = get_demo_parlay(parlay_id)
        
        if not demo_parlay:
            return jsonify({'error': 'Demo parlay not found'}), 404
        
        formatted_parlay = format_demo_parlay_for_api(demo_parlay)
        
        return jsonify({
            'message': 'Demo parlay retrieved successfully',
            'parlay': formatted_parlay
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving demo parlay {parlay_id}: {str(e)}")
        return jsonify({'error': 'Unable to retrieve demo parlay'}), 500

@educational_bp.route('/demo-parlays/random', methods=['GET'])
def get_random_demo_parlay():
    """Get a random demo parlay for learning"""
    try:
        # Get user's tier to track usage
        current_user = get_current_user()
        
        if current_user and current_user.is_active:
            # This doesn't count against their evaluation limit
            # It's educational content
            pass
        
        demo_parlay = get_demo_parlay()  # Random selection
        
        if not demo_parlay:
            return jsonify({'error': 'No demo parlays available'}), 404
        
        formatted_parlay = format_demo_parlay_for_api(demo_parlay)
        
        return jsonify({
            'message': 'Random demo parlay for learning',
            'parlay': formatted_parlay,
            'tip': 'Study the AI reasoning to improve your betting strategy'
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving random demo parlay: {str(e)}")
        return jsonify({'error': 'Unable to retrieve demo parlay'}), 500

@educational_bp.route('/tutorials', methods=['GET'])
def get_tutorials():
    """Get all available tutorials"""
    try:
        difficulty = request.args.get('difficulty')
        
        if difficulty:
            tutorials = get_tutorials_by_difficulty(difficulty)
        else:
            tutorials = get_all_tutorials()
        
        if not tutorials:
            return jsonify({
                'message': 'No tutorials found',
                'count': 0,
                'tutorials': []
            }), 200
        
        formatted_tutorials = [format_tutorial_for_api(tutorial) for tutorial in tutorials]
        
        return jsonify({
            'message': 'Tutorials retrieved successfully',
            'count': len(formatted_tutorials),
            'tutorials': formatted_tutorials,
            'available_difficulties': ['Beginner', 'Intermediate', 'Advanced']
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutorials: {str(e)}")
        return jsonify({'error': 'Unable to retrieve tutorials'}), 500

@educational_bp.route('/tutorials/<tutorial_id>', methods=['GET'])
def get_specific_tutorial(tutorial_id):
    """Get a specific tutorial by ID"""
    try:
        tutorial = get_tutorial(tutorial_id)
        
        if not tutorial:
            return jsonify({'error': 'Tutorial not found'}), 404
        
        formatted_tutorial = format_tutorial_for_api(tutorial)
        
        return jsonify({
            'message': 'Tutorial retrieved successfully',
            'tutorial': formatted_tutorial
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutorial {tutorial_id}: {str(e)}")
        return jsonify({'error': 'Unable to retrieve tutorial'}), 500

@educational_bp.route('/scenarios', methods=['GET'])
def get_betting_scenarios():
    """Get educational betting scenarios"""
    try:
        return jsonify({
            'message': 'Betting scenarios retrieved successfully',
            'count': len(BETTING_SCENARIOS),
            'scenarios': BETTING_SCENARIOS,
            'usage': 'Study these scenarios to understand professional betting strategies'
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving betting scenarios: {str(e)}")
        return jsonify({'error': 'Unable to retrieve betting scenarios'}), 500

@educational_bp.route('/progress', methods=['GET'])
@auth_required()
def get_tutorial_progress():
    """Get user's tutorial progress"""
    try:
        current_user = get_current_user()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        # In a real implementation, this would come from user profile
        # For now, return the tracker structure
        progress = get_tutorial_progress_tracker()
        
        return jsonify({
            'message': 'Tutorial progress retrieved',
            'progress': progress,
            'recommendations': [
                'Start with "Getting Started with PrizmBets AI" tutorial',
                'Practice with demo parlays before making real bets',
                'Complete beginner tutorials before moving to intermediate'
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutorial progress: {str(e)}")
        return jsonify({'error': 'Unable to retrieve progress'}), 500

@educational_bp.route('/tips', methods=['GET'])
def get_daily_tips():
    """Get daily betting tips and educational content"""
    try:
        tips = [
            {
                "category": "Bankroll Management",
                "tip": "Never bet more than 5% of your bankroll on a single wager",
                "explanation": "This protects you from major losses and allows for long-term growth"
            },
            {
                "category": "Value Betting",
                "tip": "Look for positive expected value, not just high win probability",
                "explanation": "A 60% chance bet at +200 odds has better EV than 80% chance at -300"
            },
            {
                "category": "Market Analysis",
                "tip": "Reverse line movement often indicates sharp money",
                "explanation": "When lines move opposite to public betting percentages"
            },
            {
                "category": "Correlation Risk",
                "tip": "Avoid highly correlated bets in parlays",
                "explanation": "Team total OVER + Game total OVER are highly correlated"
            },
            {
                "category": "Emotional Control",
                "tip": "Never chase losses with bigger bets",
                "explanation": "Stick to your bankroll management plan regardless of recent results"
            }
        ]
        
        # Rotate tips based on day
        from datetime import datetime
        day_of_year = datetime.now().timetuple().tm_yday
        daily_tip = tips[day_of_year % len(tips)]
        
        return jsonify({
            'message': 'Daily tip retrieved',
            'tip_of_the_day': daily_tip,
            'all_categories': [tip['category'] for tip in tips],
            'total_tips': len(tips)
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving daily tips: {str(e)}")
        return jsonify({'error': 'Unable to retrieve tips'}), 500

@educational_bp.route('/glossary', methods=['GET'])
def get_betting_glossary():
    """Get betting terms glossary"""
    try:
        glossary = {
            "Spread": "Point difference a team is expected to win/lose by",
            "Moneyline": "Straight bet on which team will win the game",
            "Total (Over/Under)": "Bet on whether combined score will be over or under a number",
            "Parlay": "Multiple bets combined into one wager - all must win",
            "Expected Value (EV)": "Theoretical profit/loss of a bet over many repetitions",
            "Kelly Criterion": "Mathematical formula for optimal bet sizing",
            "Sharp Money": "Bets placed by professional/experienced bettors",
            "Public Money": "Bets placed by casual/recreational bettors",
            "Line Movement": "How betting odds change before game starts",
            "Correlation": "How much one bet's outcome affects another bet",
            "Bankroll": "Total amount of money set aside for betting",
            "Unit": "Standard bet size, typically 1% of bankroll",
            "Juice/Vig": "Commission charged by sportsbook (typically -110)",
            "Push": "Tie result where bet is refunded",
            "Bad Beat": "Losing a bet in unlucky/unexpected fashion",
            "Steam": "Rapid line movement across multiple sportsbooks",
            "Hedge": "Placing opposite bet to guarantee profit or minimize loss",
            "Arbitrage": "Betting both sides at different books to guarantee profit",
            "Live Betting": "Placing bets while game is in progress",
            "Prop Bet": "Wager on specific player or game events"
        }
        
        return jsonify({
            'message': 'Betting glossary retrieved',
            'glossary': glossary,
            'total_terms': len(glossary)
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving glossary: {str(e)}")
        return jsonify({'error': 'Unable to retrieve glossary'}), 500

# Error handlers for educational blueprint
@educational_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Educational content not found',
        'message': 'The requested tutorial or demo content was not found'
    }), 404

@educational_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Unable to retrieve educational content'
    }), 500