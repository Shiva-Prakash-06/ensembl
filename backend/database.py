"""
Database initialization and utilities
SQLAlchemy setup for SQLite
"""

from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()


def init_db():
    """
    Initialize database tables
    Creates all tables based on models
    """
    from models.user import User
    from models.jam_post import JamPost
    from models.message import Message
    from models.ensemble import Ensemble, ensemble_members
    from models.venue import Venue
    from models.gig import Gig, GigApplication
    
    # Create all tables
    db.create_all()
    print("✓ Database tables created successfully")
