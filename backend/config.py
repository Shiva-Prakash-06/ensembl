"""
Configuration for Flask application
Environment variables and app settings
"""

import os
from datetime import timedelta


class Config:
    """Base configuration"""
    # Secret key for sessions (change in production!)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database configuration - SQLite for MVP
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///ensembl.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings (for auth tokens)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Google OAuth settings (TODO: Add real credentials)
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or 'your-google-client-id'
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'your-google-client-secret'
    
    # File upload settings (not used in MVP, but keeping for future)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
