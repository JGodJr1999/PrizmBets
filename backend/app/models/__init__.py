"""
Models package initialization for SmartBets 2.0
Exports all database models for easy importing
"""

from .user import db, User, UserProfile, BettingHistory, UserSession
from .parlay import Parlay

__all__ = [
    'db',
    'User', 
    'UserProfile', 
    'BettingHistory', 
    'UserSession',
    'Parlay'
]