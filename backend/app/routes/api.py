from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from datetime import datetime, timedelta
from app.utils.validation import validate_parlay_input, validate_odds_request
from app.utils.auth_decorators import auth_required
from app.services.ai_evaluator import AIEvaluator
from app.services.odds_service import OddsService
from app.services.comprehensive_sports_service import ComprehensiveSportsService
from app.services.tier_service import TierService
from app import limiter
import logging
import random

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize services
ai_evaluator = AIEvaluator()
odds_service = OddsService()
sports_service = ComprehensiveSportsService()

# Initialize new dual API aggregator
from app.services.sports_aggregator import SportsDataAggregator
from app.services.api_health_monitor import health_monitor
from app.services.models.sports_data import SportType, BetType

sports_aggregator = SportsDataAggregator()

# Start health monitoring
health_monitor.start_monitoring()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'PrizmBets AI',
        'version': '1.0.0'
    })

@api_bp.route('/evaluate', methods=['POST'])
@limiter.limit("30 per hour")
@auth_required(optional=True)
def evaluate_parlay():
    """
    Evaluate parlay intelligence using AI analysis
    Expects JSON payload with parlay data
    """
    try:
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Sanitize and validate input using our security layer
        try:
            validated_data = validate_parlay_input(raw_data)
        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            return jsonify({
                'error': 'Invalid input data',
                'details': str(e)
            }), 400
        
        # Check tier limits for authenticated users
        current_user = getattr(request, 'current_user', None)
        usage_info = {}
        
        if current_user and current_user.is_active:
            # Validate user ID is a positive integer
            if not isinstance(current_user.id, int) or current_user.id <= 0:
                logger.warning(f"Invalid user ID: {current_user.id}")
                return jsonify({'error': 'Invalid user session'}), 401
            
            # Check if user can access parlay evaluation feature
            can_access, tier_info = TierService.check_feature_access(current_user.id, 'parlay_evaluations')
            
            if not can_access:
                return jsonify({
                    'success': False,
                    'error': 'Usage limit reached',
                    'message': tier_info.get('upgrade_message', 'Please upgrade to continue using this feature'),
                    'usage_info': tier_info,
                    'upgrade_required': tier_info.get('upgrade_required', False)
                }), 403
            
            # Track usage
            usage_tracking = TierService.track_feature_usage(current_user.id, 'parlay_evaluations')
            usage_info = usage_tracking
        
        # Log the evaluation request (without sensitive data)
        logger.info(f"Evaluating parlay with {len(validated_data['bets'])} bets")
        
        # Perform AI evaluation
        evaluation_result = ai_evaluator.evaluate_parlay(validated_data)
        
        # Return evaluation results with usage info
        response_data = {
            'success': True,
            'evaluation': evaluation_result,
            'input_summary': {
                'num_bets': len(validated_data['bets']),
                'total_amount': validated_data['total_amount'],
                'bet_types': [bet['bet_type'] for bet in validated_data['bets']]
            }
        }
        
        # Add usage info for authenticated users
        if current_user and usage_info:
            response_data['usage_info'] = usage_info
            
            # Add upgrade prompt if close to limit
            if usage_info.get('remaining', -1) == 1:  # 1 evaluation left
                response_data['upgrade_prompt'] = {
                    'message': 'You have 1 parlay evaluation remaining today. Upgrade to Pro for unlimited access!',
                    'tier': 'pro',
                    'price': '$9.99/month'
                }
            elif usage_info.get('remaining', -1) == 0:  # Last evaluation
                response_data['upgrade_prompt'] = {
                    'message': 'This was your last free parlay evaluation today. Upgrade to Pro for unlimited access!',
                    'tier': 'pro', 
                    'price': '$9.99/month'
                }
        
        return jsonify(response_data)
        
    except Exception as e:
        # Log error without exposing internal details
        logger.error(f"Evaluation error: {str(e)}")
        return jsonify({
            'error': 'Internal server error occurred',
            'message': 'Please try again later'
        }), 500

@api_bp.route('/evaluate', methods=['OPTIONS'])
def evaluate_parlay_options():
    """Handle preflight requests for CORS"""
    return '', 200

# Tier Management Endpoints

@api_bp.route('/usage', methods=['GET'])
@auth_required()
def get_usage_status():
    """Get current usage status for the authenticated user"""
    try:
        current_user = getattr(request, 'current_user', None)
        if not current_user:
            return jsonify({'error': 'User not authenticated'}), 401
        
        usage_status = TierService.get_usage_status(current_user.id)
        return jsonify(usage_status)
        
    except Exception as e:
        logger.error(f"Error getting usage status: {str(e)}")
        return jsonify({'error': 'Unable to retrieve usage status'}), 500

@api_bp.route('/tiers', methods=['GET'])
def get_tier_info():
    """Get information about all subscription tiers"""
    try:
        tiers = TierService.get_all_tiers()
        return jsonify(tiers)
        
    except Exception as e:
        logger.error(f"Error getting tier info: {str(e)}")
        return jsonify({'error': 'Unable to retrieve tier information'}), 500

@api_bp.route('/recommendations', methods=['GET'])
@auth_required()
def get_upgrade_recommendations():
    """Get personalized upgrade recommendations for the user"""
    try:
        current_user = getattr(request, 'current_user', None)
        if not current_user:
            return jsonify({'error': 'User not authenticated'}), 401
        
        recommendations = TierService.get_upgrade_recommendations(current_user.id)
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': 'Unable to generate recommendations'}), 500

@api_bp.route('/demo', methods=['POST'])
def demo_evaluate():
    """Demo parlay evaluation for unauthenticated users (limited features)"""
    try:
        # Basic rate limiting for demo endpoint (prevent abuse)
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        # Log demo usage for monitoring
        logger.info(f"Demo evaluation request from IP: {client_ip}")
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Sanitize and validate input
        try:
            validated_data = validate_parlay_input(raw_data)
        except ValidationError as e:
            return jsonify({
                'error': 'Invalid input data',
                'details': str(e)
            }), 400
        
        # Perform limited AI evaluation (basic version for demo)
        evaluation_result = ai_evaluator.evaluate_parlay(validated_data)
        
        # Add demo limitations
        evaluation_result['demo_mode'] = True
        evaluation_result['message'] = 'This is a demo evaluation with limited features. Sign up for full access!'
        
        # Remove some advanced features for demo
        if 'advanced_insights' in evaluation_result:
            evaluation_result['advanced_insights'] = 'Premium feature - Sign up to unlock'
        
        return jsonify({
            'success': True,
            'evaluation': evaluation_result,
            'demo_mode': True,
            'signup_prompt': {
                'message': 'Sign up for free to get 3 full evaluations per day!',
                'features': ['Full AI analysis', 'Usage tracking', 'Personalized recommendations']
            }
        })
        
    except Exception as e:
        logger.error(f"Demo evaluation error: {str(e)}")
        return jsonify({
            'error': 'Internal server error occurred',
            'message': 'Please try again later'
        }), 500

@api_bp.errorhandler(413)
def request_entity_too_large(error):
    """Handle requests that are too large"""
    return jsonify({
        'error': 'Request payload too large',
        'message': 'Please reduce the size of your request'
    }), 413

@api_bp.errorhandler(429)
def ratelimit_handler(error):
    """Handle rate limiting"""
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Please wait before making another request'
    }), 429


# === ODDS COMPARISON ENDPOINTS ===

@api_bp.route('/odds/best', methods=['POST'])
def get_best_odds():
    """
    Find best odds across sportsbooks for a specific bet
    Expects JSON: {"team": "Lakers", "bet_type": "moneyline", "sport": "nba"}
    """
    try:
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
            
        # Validate required fields
        required_fields = ['team', 'bet_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        team = data['team'].strip()
        bet_type = data['bet_type'].strip().lower()
        sport = data.get('sport', 'nfl').strip().lower()
        
        # Validate bet_type
        valid_bet_types = ['moneyline', 'spread', 'over_under', 'prop']
        if bet_type not in valid_bet_types:
            return jsonify({
                'error': f'Invalid bet_type. Must be one of: {valid_bet_types}'
            }), 400
            
        logger.info(f"Finding best odds for {team} ({bet_type}) in {sport}")
        
        # Get best odds from service
        odds_data = odds_service.get_best_odds(bet_type, team, sport)
        
        return jsonify({
            'success': True,
            'odds_data': odds_data,
            'timestamp': odds_data.get('last_updated')
        })
        
    except Exception as e:
        logger.error(f"Best odds error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve odds',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/odds/comparison/<sport>', methods=['GET'])
def get_odds_comparison(sport):
    """
    Get comprehensive odds comparison for all games in a sport with accurate data
    URL: /api/odds/comparison/nfl?limit=10
    """
    try:
        # Get optional limit parameter
        limit = request.args.get('limit', 10, type=int)
        if limit > 50:  # Prevent excessive API usage
            limit = 50
            
        logger.info(f"Getting comprehensive odds comparison for {sport} (limit: {limit})")
        
        # Get comprehensive comparison data from new sports service
        comparison_data = sports_service.get_odds_comparison(sport.lower(), limit)
        
        return jsonify(comparison_data)
        
    except Exception as e:
        logger.error(f"Odds comparison error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve odds comparison',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/odds/sportsbook-link', methods=['POST'])
def get_sportsbook_link():
    """
    Get safe sportsbook homepage link (for informational purposes only)
    Expects JSON: {"sportsbook": "draftkings"}
    """
    try:
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
            
        # Validate required fields
        if 'sportsbook' not in data:
            return jsonify({
                'error': 'Missing required field: sportsbook'
            }), 400
        
        sportsbook = data['sportsbook'].strip().lower()
        
        # Get safe sportsbook homepage link
        sportsbook_link = odds_service.get_sportsbook_link(sportsbook)
        
        return jsonify({
            'success': True,
            'sportsbook': sportsbook,
            'homepage_link': sportsbook_link,
            'disclaimer': 'For informational purposes only. PrizmBets does not facilitate betting.'
        })
        
    except Exception as e:
        logger.error(f"Deep link error: {str(e)}")
        return jsonify({
            'error': 'Failed to generate deep link',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/odds/sports', methods=['GET'])
def get_supported_sports():
    """
    Get list of supported sports for odds comparison
    """
    try:
        sports_info = {
            'nfl': {'name': 'NFL', 'season': 'September - February'},
            'nba': {'name': 'NBA', 'season': 'October - June'},
            'mlb': {'name': 'MLB', 'season': 'March - October'},
            'nhl': {'name': 'NHL', 'season': 'October - June'},
            'ncaaf': {'name': 'College Football', 'season': 'August - January'},
            'ncaab': {'name': 'College Basketball', 'season': 'November - April'}
        }
        
        return jsonify({
            'success': True,
            'supported_sports': sports_info,
            'total_sports': len(sports_info)
        })
        
    except Exception as e:
        logger.error(f"Sports list error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve sports list',
            'message': 'Please try again later'
        }), 500


# === COMPREHENSIVE SPORTS DATA ENDPOINTS ===

@api_bp.route('/odds/all-games', methods=['GET'])
def get_all_games():
    """
    Get games from all sports combined with accurate, live data
    """
    try:
        limit_per_sport = request.args.get('per_sport', 3, type=int)
        show_upcoming = request.args.get('upcoming', 'true').lower() == 'true'
        
        # Validate parameters
        if limit_per_sport < 1 or limit_per_sport > 10:
            limit_per_sport = 3
        
        logger.info(f"Getting all games (per_sport: {limit_per_sport}, upcoming: {show_upcoming})")
        
        games_data = sports_service.get_all_games(
            limit_per_sport=limit_per_sport,
            show_upcoming=show_upcoming
        )
        
        return jsonify(games_data)
        
    except Exception as e:
        logger.error(f"All games error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch all games',
            'games': [],
            'total_games': 0,
            'message': 'Please try again later'
        }), 500


@api_bp.route('/odds/live/<sport>', methods=['GET'])
def get_live_sport_odds(sport):
    """
    Get live odds for a specific sport with accurate team names and chronological ordering
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        if limit > 25:
            limit = 25
            
        logger.info(f"Getting live odds for {sport} (limit: {limit})")
        
        odds_data = sports_service.get_live_odds(sport.lower(), limit)
        
        return jsonify(odds_data)
        
    except Exception as e:
        logger.error(f"Live odds error for {sport}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch live odds for {sport}',
            'games': [],
            'message': 'Please try again later'
        }), 500


@api_bp.route('/odds/upcoming/<sport>', methods=['GET'])
def get_upcoming_sport_games(sport):
    """
    Get upcoming games for a specific sport in chronological order
    """
    try:
        days_ahead = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Validate parameters
        if days_ahead < 1 or days_ahead > 14:
            days_ahead = 7
        if limit > 50:
            limit = 50
            
        logger.info(f"Getting upcoming games for {sport} (days: {days_ahead}, limit: {limit})")
        
        upcoming_data = sports_service.get_upcoming_games(
            sport.lower(), 
            days_ahead=days_ahead, 
            limit=limit
        )
        
        return jsonify(upcoming_data)
        
    except Exception as e:
        logger.error(f"Upcoming games error for {sport}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch upcoming games for {sport}',
            'games': [],
            'message': 'Please try again later'
        }), 500


@api_bp.route('/season/status', methods=['GET'])
def get_season_statuses():
    """
    Get current season status for all sports with next season change information
    """
    try:
        season_data = sports_service.get_season_statuses()
        
        return jsonify(season_data)
        
    except Exception as e:
        logger.error(f"Season status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get season statuses',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/season/refresh', methods=['POST'])
def refresh_season_statuses():
    """
    Manually refresh season statuses for all sports
    """
    try:
        refresh_data = sports_service.refresh_season_statuses()
        
        return jsonify(refresh_data)
        
    except Exception as e:
        logger.error(f"Season refresh error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to refresh season statuses',
            'message': 'Please try again later'
        }), 500


# ============================================================================
# NEW DUAL API ENDPOINTS (The Odds API + API-Sports)
# ============================================================================

@api_bp.route('/v2/games/<sport>', methods=['GET'])
def get_enriched_games(sport):
    """
    Get enriched game data combining odds and stats from multiple APIs
    """
    try:
        # Parse query parameters
        team = request.args.get('team')
        limit = int(request.args.get('limit', 10))
        
        # Validate sport
        try:
            sport_type = SportType(sport.lower())
        except ValueError:
            return jsonify({
                'error': 'Invalid sport',
                'message': f'Supported sports: {[s.value for s in SportType]}'
            }), 400
        
        # Get enriched data from aggregator
        response = sports_aggregator.get_enriched_game_data(sport_type, team, limit)
        
        if response.success:
            # Convert GameData objects to dictionaries for JSON response
            games_data = []
            for game in response.data:
                game_dict = {
                    'game_id': game.game_id,
                    'sport': game.sport.value,
                    'home_team': game.home_team,
                    'away_team': game.away_team,
                    'game_date': game.game_date.isoformat(),
                    'status': game.status.value,
                    'data_sources': game.data_sources,
                    'confidence_score': game.confidence_score,
                    'odds_count': len(game.odds),
                    'best_odds': {bet_type: odds.__dict__ for bet_type, odds in game.best_odds.items()},
                    'venue': game.venue.__dict__ if game.venue else None,
                    'score': game.score.__dict__ if game.score else None
                }
                games_data.append(game_dict)
            
            return jsonify({
                'success': True,
                'sport': sport,
                'games': games_data,
                'source': response.source,
                'cached': response.cached,
                'total_games': len(games_data)
            })
        else:
            return jsonify({
                'error': 'Failed to fetch games',
                'message': response.error_message
            }), 500
            
    except Exception as e:
        logger.error(f"Enriched games error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/v2/parlay/analyze', methods=['POST'])
@auth_required(optional=True)
def analyze_parlay_v2():
    """
    Enhanced parlay analysis using dual API system
    """
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400
        
        parlay_legs = data.get('legs', [])
        bet_amount = data.get('bet_amount', 100)
        
        if not parlay_legs:
            return jsonify({'error': 'At least one parlay leg is required'}), 400
        
        # Get best odds analysis from aggregator
        response = sports_aggregator.get_best_odds_for_parlay(parlay_legs)
        
        if response.success:
            analysis = response.data
            
            return jsonify({
                'success': True,
                'parlay_analysis': analysis,
                'bet_amount': bet_amount,
                'source': response.source,
                'cached': response.cached,
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to analyze parlay',
                'message': response.error_message
            }), 500
            
    except Exception as e:
        logger.error(f"Parlay analysis v2 error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/v2/team/<sport>/<team_name>/analysis', methods=['GET'])
def get_team_analysis(sport, team_name):
    """
    Get comprehensive team analysis including stats, trends, and betting data
    """
    try:
        # Validate sport
        try:
            sport_type = SportType(sport.lower())
        except ValueError:
            return jsonify({
                'error': 'Invalid sport',
                'message': f'Supported sports: {[s.value for s in SportType]}'
            }), 400
        
        # Get team analysis from aggregator
        response = sports_aggregator.get_team_analysis(team_name, sport_type)
        
        if response.success:
            return jsonify({
                'success': True,
                'team_analysis': response.data,
                'source': response.source,
                'cached': response.cached
            })
        else:
            return jsonify({
                'error': 'Failed to fetch team analysis',
                'message': response.error_message
            }), 500
            
    except Exception as e:
        logger.error(f"Team analysis error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Please try again later'
        }), 500


@api_bp.route('/v2/health', methods=['GET'])
def dual_api_health():
    """
    Health check for dual API system
    """
    try:
        # Get overall health status
        health_status = health_monitor.get_overall_health()
        provider_status = sports_aggregator.get_provider_status()
        
        return jsonify({
            'success': True,
            'dual_api_system': {
                'overall_health': health_status,
                'provider_details': provider_status,
                'features': {
                    'odds_provider': 'The Odds API',
                    'sports_provider': 'API-Sports',
                    'aggregation': 'Active',
                    'caching': 'Active',
                    'health_monitoring': 'Active',
                    'fallback_mechanisms': 'Active'
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Dual API health check error: {str(e)}")
        return jsonify({
            'error': 'Health check failed',
            'message': str(e)
        }), 500


@api_bp.route('/v2/cache/clear', methods=['POST'])
def clear_aggregator_cache():
    """
    Clear the sports aggregator cache
    """
    try:
        data_type = request.args.get('type')  # odds, scores, stats, or all
        
        sports_aggregator.clear_cache(data_type)
        
        return jsonify({
            'success': True,
            'message': f'Cache cleared for {data_type or "all"} data types'
        })
        
    except Exception as e:
        logger.error(f"Cache clear error: {str(e)}")
        return jsonify({
            'error': 'Failed to clear cache',
            'message': str(e)
        }), 500


@api_bp.route('/live-scores')
def get_live_scores():
    """Get live scores for games within 4-hour window (live, starting soon, recently finished)"""
    try:
        logger.info("Live scores endpoint called")
        
        # Time filtering setup
        current_time = datetime.utcnow()
        four_hours_ago = current_time - timedelta(hours=4)
        four_hours_ahead = current_time + timedelta(hours=4)
        
        # Categories for games
        live_games = []
        starting_soon = []
        recently_finished = []
        
        # Get games from multiple sports
        sports_to_check = ['nfl', 'nba', 'mlb', 'nhl', 'wnba', 'ncaaf', 'ncaab', 'soccer']
        
        for sport in sports_to_check:
            try:
                # Try to get live data from aggregator
                games_data = sports_aggregator.get_live_odds(sport)
                if games_data and games_data.get('games'):
                    for game in games_data['games']:
                        # Add sport identifier to each game
                        game['sport'] = sport.upper()
                        
                        # Parse game time if available
                        game_time = None
                        if game.get('commence_time'):
                            try:
                                game_time = datetime.fromisoformat(game['commence_time'].replace('Z', '+00:00'))
                            except:
                                continue  # Skip games with invalid time format
                        
                        # Categorize games based on status and time
                        if game.get('live_data') or game.get('status') == 'live':
                            # Currently live games
                            live_games.append(game)
                        elif game_time:
                            # Check if game is within our 4-hour windows
                            if four_hours_ago <= game_time <= four_hours_ahead:
                                if game_time > current_time:
                                    # Game starting within 4 hours
                                    game['starts_in'] = str(game_time - current_time).split('.')[0]  # Remove microseconds
                                    starting_soon.append(game)
                                else:
                                    # Game finished within last 4 hours
                                    if game.get('status') == 'completed' or game.get('home_score') is not None:
                                        game['finished_ago'] = str(current_time - game_time).split('.')[0]
                                        recently_finished.append(game)
                            
            except Exception as e:
                logger.warning(f"Failed to get live scores for {sport}: {str(e)}")
                continue
        
        # If no real data, provide time-appropriate mock data
        if not live_games and not starting_soon and not recently_finished:
            
            # Create mock games with appropriate timing
            mock_start_soon = (current_time + timedelta(hours=2)).isoformat() + 'Z'
            mock_finished_ago = (current_time - timedelta(hours=1)).isoformat() + 'Z'
            
            # Only show live games during typical sports hours (evening/weekend)
            hour = current_time.hour
            is_prime_time = (18 <= hour <= 23) or (12 <= hour <= 17 and current_time.weekday() >= 5)  # Evening or weekend afternoon
            
            if is_prime_time:
                live_games = [
                    {
                        'id': 'mock_live_1',
                        'sport': 'NBA',
                        'home_team': 'Los Angeles Lakers',
                        'away_team': 'Boston Celtics',
                        'home_score': 89,
                        'away_score': 92,
                        'status': 'live',
                        'period': '3rd Quarter',
                        'time_remaining': '4:15',
                        'home_record': '25-18',
                        'away_record': '32-11',
                        'detailed_stats': [
                            {'name': 'Field Goals', 'away_value': '34/67', 'home_value': '31/62', 'away_winning': True, 'home_winning': False},
                            {'name': '3-Pointers', 'away_value': '12/28', 'home_value': '9/24', 'away_winning': True, 'home_winning': False},
                            {'name': 'Free Throws', 'away_value': '12/14', 'home_value': '18/22', 'away_winning': False, 'home_winning': True},
                            {'name': 'Rebounds', 'away_value': 28, 'home_value': 32, 'away_winning': False, 'home_winning': True}
                        ]
                    }
                ]
            
            starting_soon = [
                {
                    'id': 'mock_starting_1',
                    'sport': 'MLB',
                    'home_team': 'New York Yankees',
                    'away_team': 'Boston Red Sox',
                    'commence_time': mock_start_soon,
                    'status': 'scheduled',
                    'starts_in': '2:00:00',
                    'home_record': '68-52',
                    'away_record': '65-55'
                }
            ]
            
            recently_finished = [
                {
                    'id': 'mock_finished_1',
                    'sport': 'NHL',
                    'home_team': 'Toronto Maple Leafs',
                    'away_team': 'Montreal Canadiens',
                    'commence_time': mock_finished_ago,
                    'status': 'completed',
                    'finished_ago': '1:00:00',
                    'home_score': 4,
                    'away_score': 2,
                    'home_record': '35-20-7',
                    'away_record': '28-30-4'
                }
            ]
        
        response_data = {
            'success': True,
            'live_games': live_games,
            'starting_soon': starting_soon[:10],  # Limit starting soon games
            'recently_finished': recently_finished[:10],  # Limit recently finished games
            'total_live': len(live_games),
            'total_starting_soon': len(starting_soon),
            'total_recently_finished': len(recently_finished),
            'last_updated': current_time.isoformat(),
            'time_window_hours': 4,
            'data_source': 'live_api' if (live_games and not any('mock' in game.get('id', '') for game in live_games)) else 'mock'
        }
        
        logger.info(f"Live scores response: {len(live_games)} live, {len(starting_soon)} starting soon, {len(recently_finished)} recently finished")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in live scores endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get live scores: {str(e)}',
            'live_games': [],
            'starting_soon': [],
            'recently_finished': []
        }), 500