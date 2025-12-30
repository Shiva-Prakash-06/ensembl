"""
Test configuration and fixtures
"""
import pytest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.jam_post import JamPost
from models.gig import Gig
from models.message import Message


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()


@pytest.fixture
def musician_user(app):
    """Create a test musician user"""
    with app.app_context():
        user = User(
            email='musician@test.com',
            name='Test Musician',
            city='San Francisco',
            role='musician',
            instrument='Guitar',
            google_id='test_google_musician'
        )
        db.session.add(user)
        db.session.commit()
        return user.id


@pytest.fixture
def venue_user(app):
    """Create a test venue user"""
    with app.app_context():
        user = User(
            email='venue@test.com',
            name='Test Venue',
            city='San Francisco',
            role='venue',
            google_id='test_google_venue'
        )
        db.session.add(user)
        db.session.commit()
        return user.id


@pytest.fixture
def ensemble(app, musician_user):
    """Create a test ensemble"""
    with app.app_context():
        ensemble = Ensemble(
            name='Test Band',
            leader_id=musician_user
        )
        db.session.add(ensemble)
        db.session.commit()
        return ensemble.id


@pytest.fixture
def jam_post(app, musician_user):
    """Create a test jam post"""
    with app.app_context():
        post = JamPost(
            author_id=musician_user,
            looking_for_instrument='Drums',
            location='San Francisco',
            description='Looking for a drummer!'
        )
        db.session.add(post)
        db.session.commit()
        return post.id
