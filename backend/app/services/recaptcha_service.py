"""
reCAPTCHA verification service for validating frontend reCAPTCHA tokens.
"""
import requests
import logging
from typing import Dict, Any
from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class RecaptchaService:
    """Service for verifying reCAPTCHA v3 tokens"""
    
    def __init__(self):
        self.secret_key = settings.RECAPTCHA_SECRET_KEY
        self.verify_url = "https://www.google.com/recaptcha/api/siteverify"
        self.minimum_score = 0.5  # Minimum score for valid requests
        
    def verify_token(self, token: str, action: str = None, remote_ip: str = None) -> Dict[str, Any]:
        """
        Verify a reCAPTCHA token with Google's API
        
        Args:
            token: The reCAPTCHA token from the frontend
            action: The action associated with this token (optional)
            remote_ip: The user's IP address (optional)
            
        Returns:
            Dictionary containing verification results
        """
        if not token:
            return {
                "success": False,
                "error": "No reCAPTCHA token provided",
                "score": 0.0
            }
            
        if not self.secret_key:
            logger.warning("reCAPTCHA secret key not configured - accepting all requests")
            return {
                "success": True,
                "score": 1.0,
                "action": action,
                "hostname": "localhost"
            }
        
        try:
            # Prepare the request data
            data = {
                'secret': self.secret_key,
                'response': token
            }
            
            if remote_ip:
                data['remoteip'] = remote_ip
                
            # Make the verification request
            response = requests.post(
                self.verify_url,
                data=data,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"reCAPTCHA API returned status {response.status_code}")
                return {
                    "success": False,
                    "error": "reCAPTCHA verification service unavailable",
                    "score": 0.0
                }
                
            result = response.json()
            
            # Check if the verification was successful
            if not result.get('success', False):
                error_codes = result.get('error-codes', [])
                logger.warning(f"reCAPTCHA verification failed: {error_codes}")
                return {
                    "success": False,
                    "error": f"reCAPTCHA verification failed: {', '.join(error_codes)}",
                    "score": 0.0,
                    "error_codes": error_codes
                }
            
            # Extract the score (for v3)
            score = result.get('score', 1.0)
            
            # Check if the action matches (if provided)
            if action and result.get('action') != action:
                logger.warning(f"reCAPTCHA action mismatch: expected {action}, got {result.get('action')}")
                return {
                    "success": False,
                    "error": "reCAPTCHA action mismatch",
                    "score": score
                }
            
            # Check if the score meets our minimum threshold
            if score < self.minimum_score:
                logger.warning(f"reCAPTCHA score too low: {score} < {self.minimum_score}")
                return {
                    "success": False,
                    "error": f"reCAPTCHA score too low: {score}",
                    "score": score
                }
                
            logger.info(f"reCAPTCHA verification successful: score={score}, action={action}")
            return {
                "success": True,
                "score": score,
                "action": result.get('action'),
                "challenge_ts": result.get('challenge_ts'),
                "hostname": result.get('hostname')
            }
            
        except requests.RequestException as e:
            logger.error(f"reCAPTCHA verification request failed: {e}")
            return {
                "success": False,
                "error": "reCAPTCHA verification service unavailable",
                "score": 0.0
            }
        except Exception as e:
            logger.error(f"Unexpected error during reCAPTCHA verification: {e}")
            return {
                "success": False,
                "error": "Internal reCAPTCHA verification error",
                "score": 0.0
            }
    
    def is_valid_token(self, token: str, action: str = None, remote_ip: str = None) -> bool:
        """
        Simple boolean check for token validity
        
        Args:
            token: The reCAPTCHA token from the frontend
            action: The action associated with this token (optional)
            remote_ip: The user's IP address (optional)
            
        Returns:
            True if token is valid, False otherwise
        """
        result = self.verify_token(token, action, remote_ip)
        return result.get("success", False)

# Global instance
recaptcha_service = RecaptchaService()