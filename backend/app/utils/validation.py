import re
from marshmallow import Schema, fields, validate, ValidationError
from typing import Dict, Any, List
from functools import wraps
from flask import request, jsonify

def validate_json(f):
    """Decorator to validate JSON request body"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        return f(*args, **kwargs)
    return decorated_function

def validate_required_fields(required_fields):
    """Decorator to validate required fields in JSON request"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            missing = [field for field in required_fields if field not in data]
            
            if missing:
                return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class InputSanitizer:
    """Centralized input sanitization for security"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitize string input - remove dangerous characters and limit length"""
        if not isinstance(value, str):
            raise ValidationError("Input must be a string")
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\'\(\);]', '', value)
        
        # Limit length
        if len(sanitized) > max_length:
            raise ValidationError(f"Input too long (max {max_length} characters)")
        
        return sanitized.strip()
    
    @staticmethod
    def validate_numeric(value: Any, min_val: float = None, max_val: float = None) -> float:
        """Validate and sanitize numeric input"""
        try:
            num_value = float(value)
        except (ValueError, TypeError):
            raise ValidationError("Input must be a valid number")
        
        if min_val is not None and num_value < min_val:
            raise ValidationError(f"Value must be at least {min_val}")
        
        if max_val is not None and num_value > max_val:
            raise ValidationError(f"Value must be at most {max_val}")
        
        return num_value

class BetSchema(Schema):
    """Schema for individual bet validation"""
    team = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    odds = fields.Float(required=True, validate=validate.Range(min=-10000, max=10000))
    bet_type = fields.Str(required=True, validate=validate.OneOf(['spread', 'moneyline', 'over_under', 'prop']))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01, max=10000))
    sportsbook = fields.Str(required=False, validate=validate.Length(max=50))

class ParlaySchema(Schema):
    """Schema for parlay validation with security constraints"""
    bets = fields.List(fields.Nested(BetSchema), required=True, validate=validate.Length(min=1, max=10))
    total_amount = fields.Float(required=True, validate=validate.Range(min=0.01, max=10000))
    user_notes = fields.Str(required=False, validate=validate.Length(max=500))

def validate_parlay_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize parlay input data"""
    schema = ParlaySchema()
    
    try:
        # Validate schema
        validated_data = schema.load(data)
        
        # Additional sanitization
        if 'user_notes' in validated_data:
            validated_data['user_notes'] = InputSanitizer.sanitize_string(
                validated_data['user_notes'], max_length=500
            )
        
        # Sanitize team names
        for bet in validated_data['bets']:
            bet['team'] = InputSanitizer.sanitize_string(bet['team'], max_length=100)
            if 'sportsbook' in bet:
                bet['sportsbook'] = InputSanitizer.sanitize_string(bet['sportsbook'], max_length=50)
        
        return validated_data
        
    except ValidationError as e:
        raise ValidationError(f"Invalid input data: {e.messages}")


class OddsRequestSchema(Schema):
    """Schema for odds comparison requests"""
    team = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    sport = fields.Str(required=False, validate=validate.OneOf(['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab']))
    bet_type = fields.Str(required=True, validate=validate.OneOf(['moneyline', 'spread', 'over_under', 'prop']))


def validate_odds_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize odds request data"""
    schema = OddsRequestSchema()
    
    try:
        # Validate schema
        validated_data = schema.load(data)
        
        # Sanitize team name
        validated_data['team'] = InputSanitizer.sanitize_string(
            validated_data['team'], max_length=100
        )
        
        # Set default sport if not provided
        if 'sport' not in validated_data:
            validated_data['sport'] = 'nfl'
        
        return validated_data
        
    except ValidationError as e:
        raise ValidationError(f"Invalid odds request: {e.messages}")