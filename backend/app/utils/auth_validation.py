"""
Authentication validation schemas and utilities for PrizmBets
Handles validation for registration, login, and profile updates
"""

import re
from marshmallow import Schema, fields, validate, ValidationError, validates_schema, post_load
from app.utils.validation import InputSanitizer

class PasswordValidator:
    """Custom password validation with security requirements"""
    
    @staticmethod
    def validate_password_strength(password):
        """
        Validate password meets enhanced security requirements
        Requirements:
        - At least 12 characters (increased from 8)
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
        - Contains special character
        - No common patterns
        - No repeated characters more than 3 times
        """
        if not isinstance(password, str):
            raise ValidationError("Password must be a string")
        
        errors = []
        
        # Minimum length requirement (increased for better security)
        if len(password) < 12:
            errors.append("Password must be at least 12 characters long")
        
        if len(password) > 128:
            errors.append("Password cannot exceed 128 characters")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter (A-Z)")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter (a-z)")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number (0-9)")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\;\'\/~`]', password):
            errors.append("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)")
        
        # Check for repeated characters (security enhancement)
        for char in password:
            if password.count(char) > 3:
                errors.append("Password cannot contain the same character more than 3 times")
                break
        
        # Check for sequential characters (keyboard patterns)
        sequential_patterns = [
            r'(012|123|234|345|456|567|678|789)',  # Sequential numbers
            r'(qwe|ert|rty|tyu|yui|uio|iop)',      # QWERTY row 1
            r'(asd|sdf|dfg|fgh|ghj|hjk|jkl)',      # QWERTY row 2  
            r'(zxc|xcv|cvb|vbn|bnm)',              # QWERTY row 3
            r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)' # Alphabetical
        ]
        
        for pattern in sequential_patterns:
            if re.search(pattern, password.lower()):
                errors.append("Password cannot contain sequential characters (e.g., 123, abc, qwerty)")
                break
        
        # Enhanced common weak passwords check
        weak_passwords = [
            'password123', 'password1234', 'password12345',
            'admin123', 'admin1234', 'administrator',
            'welcome123', 'welcome1234', 'letmein123',
            'prizmbets123', 'sports123', 'betting123',
            '123456789', '1234567890', '12345678901',
            'qwerty123', 'qwerty1234', 'asdfgh123',
            'football123', 'basketball123', 'baseball123'
        ]
        
        for weak in weak_passwords:
            if password.lower() == weak or weak in password.lower():
                errors.append("Password is too common. Please choose a more unique password.")
                break
        
        # Check for repeated patterns
        if re.search(r'(.{2,})\1{2,}', password):
            errors.append("Password cannot contain repeated patterns")
        
        if errors:
            raise ValidationError(errors)
        
        return password

class EmailValidator:
    """Custom email validation"""
    
    @staticmethod
    def validate_email_format(email):
        """Validate email format and domain"""
        if not isinstance(email, str):
            raise ValidationError("Email must be a string")
        
        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format")
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'\.{2,}',  # Multiple consecutive dots
            r'^\.|\.$',  # Starts or ends with dot
            r'@.*@',  # Multiple @ symbols
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email):
                raise ValidationError("Invalid email format")
        
        return email.lower().strip()

class UserRegistrationSchema(Schema):
    """Schema for user registration validation"""
    
    email = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=255, error="Email must be between 3 and 255 characters"),
            EmailValidator.validate_email_format
        ]
    )
    
    password = fields.Str(
        required=True,
        validate=[
            validate.Length(min=12, max=128, error="Password must be between 12 and 128 characters"),
            PasswordValidator.validate_password_strength
        ]
    )
    
    confirm_password = fields.Str(
        required=True,
        validate=validate.Length(min=12, max=128, error="Confirm password must be between 12 and 128 characters")
    )
    
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255, error="Name must be between 1 and 255 characters")
    )
    
    terms_accepted = fields.Bool(
        required=True,
        validate=validate.Equal(True, error="You must accept the terms and conditions")
    )
    
    marketing_emails = fields.Bool(missing=False)
    
    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        """Validate that password and confirm_password match"""
        if 'password' in data and 'confirm_password' in data:
            if data['password'] != data['confirm_password']:
                raise ValidationError({'confirm_password': ['Passwords do not match']})
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        if 'name' in data:
            data['name'] = InputSanitizer.sanitize_string(data['name'], max_length=255)
        
        if 'email' in data:
            data['email'] = data['email'].lower().strip()
        
        # Remove confirm_password from final data
        data.pop('confirm_password', None)
        
        return data

class UserLoginSchema(Schema):
    """Schema for user login validation"""
    
    email = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=255, error="Email must be between 3 and 255 characters"),
            EmailValidator.validate_email_format
        ]
    )
    
    password = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=128, error="Password is required")
    )
    
    remember_me = fields.Bool(missing=False)
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        if 'email' in data:
            data['email'] = data['email'].lower().strip()
        
        return data

class PasswordResetRequestSchema(Schema):
    """Schema for password reset request validation"""
    
    email = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=255, error="Email must be between 3 and 255 characters"),
            EmailValidator.validate_email_format
        ]
    )
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        if 'email' in data:
            data['email'] = data['email'].lower().strip()
        
        return data

class PasswordResetSchema(Schema):
    """Schema for password reset validation"""
    
    token = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255, error="Reset token is required")
    )
    
    password = fields.Str(
        required=True,
        validate=[
            validate.Length(min=12, max=128, error="Password must be between 12 and 128 characters"),
            PasswordValidator.validate_password_strength
        ]
    )
    
    confirm_password = fields.Str(
        required=True,
        validate=validate.Length(min=12, max=128, error="Confirm password must be between 12 and 128 characters")
    )
    
    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        """Validate that password and confirm_password match"""
        if 'password' in data and 'confirm_password' in data:
            if data['password'] != data['confirm_password']:
                raise ValidationError({'confirm_password': ['Passwords do not match']})
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        # Remove confirm_password from final data
        data.pop('confirm_password', None)
        return data

class UserProfileUpdateSchema(Schema):
    """Schema for user profile updates"""
    
    name = fields.Str(
        validate=validate.Length(min=1, max=255, error="Name must be between 1 and 255 characters"),
        allow_none=True
    )
    
    timezone = fields.Str(
        validate=validate.Length(min=1, max=50, error="Timezone must be between 1 and 50 characters"),
        allow_none=True
    )
    
    favorite_sports = fields.List(
        fields.Str(validate=validate.OneOf(['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab'])),
        validate=validate.Length(max=10, error="Maximum 10 favorite sports allowed"),
        allow_none=True
    )
    
    preferred_sportsbooks = fields.List(
        fields.Str(validate=validate.Length(max=50)),
        validate=validate.Length(max=10, error="Maximum 10 preferred sportsbooks allowed"),
        allow_none=True
    )
    
    default_bet_amount = fields.Decimal(
        validate=validate.Range(min=0.01, max=10000, error="Default bet amount must be between $0.01 and $10,000"),
        allow_none=True
    )
    
    risk_tolerance = fields.Str(
        validate=validate.OneOf(['low', 'medium', 'high'], error="Risk tolerance must be low, medium, or high"),
        allow_none=True
    )
    
    email_notifications = fields.Bool(allow_none=True)
    push_notifications = fields.Bool(allow_none=True)
    marketing_emails = fields.Bool(allow_none=True)
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        if 'name' in data and data['name']:
            data['name'] = InputSanitizer.sanitize_string(data['name'], max_length=255)
        
        if 'timezone' in data and data['timezone']:
            data['timezone'] = InputSanitizer.sanitize_string(data['timezone'], max_length=50)
        
        # Sanitize sportsbook names
        if 'preferred_sportsbooks' in data and data['preferred_sportsbooks']:
            data['preferred_sportsbooks'] = [
                InputSanitizer.sanitize_string(sb, max_length=50) 
                for sb in data['preferred_sportsbooks']
            ]
        
        return data

class ChangePasswordSchema(Schema):
    """Schema for password change validation"""
    
    current_password = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=128, error="Current password is required")
    )
    
    new_password = fields.Str(
        required=True,
        validate=[
            validate.Length(min=12, max=128, error="New password must be between 12 and 128 characters"),
            PasswordValidator.validate_password_strength
        ]
    )
    
    confirm_new_password = fields.Str(
        required=True,
        validate=validate.Length(min=12, max=128, error="Confirm new password must be between 12 and 128 characters")
    )
    
    @validates_schema
    def validate_passwords(self, data, **kwargs):
        """Validate password requirements"""
        errors = {}
        
        # Check that new passwords match
        if 'new_password' in data and 'confirm_new_password' in data:
            if data['new_password'] != data['confirm_new_password']:
                errors['confirm_new_password'] = ['New passwords do not match']
        
        # Check that new password is different from current
        if 'current_password' in data and 'new_password' in data:
            if data['current_password'] == data['new_password']:
                errors['new_password'] = ['New password must be different from current password']
        
        if errors:
            raise ValidationError(errors)
    
    @post_load
    def sanitize_data(self, data, **kwargs):
        """Sanitize input data after validation"""
        # Remove confirm_new_password from final data
        data.pop('confirm_new_password', None)
        return data

# Validation helper functions
def validate_registration_data(data):
    """Validate user registration data"""
    schema = UserRegistrationSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Registration validation failed: {e.messages}")

def validate_login_data(data):
    """Validate user login data"""
    schema = UserLoginSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Login validation failed: {e.messages}")

def validate_profile_update_data(data):
    """Validate profile update data"""
    schema = UserProfileUpdateSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Profile update validation failed: {e.messages}")

def validate_password_change_data(data):
    """Validate password change data"""
    schema = ChangePasswordSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Password change validation failed: {e.messages}")

def validate_password_reset_request_data(data):
    """Validate password reset request data"""
    schema = PasswordResetRequestSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Password reset request validation failed: {e.messages}")

def validate_password_reset_data(data):
    """Validate password reset data"""
    schema = PasswordResetSchema()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Password reset validation failed: {e.messages}")