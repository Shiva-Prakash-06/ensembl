"""
Test Musician Pages and Endpoints
Tests all musician-accessible endpoints to ensure they work correctly
"""

import pytest
from app import create_app
from database import db
from models.user import User
from models.ensemble import Ensemble
from models.gig import Gig, GigApplication
from models.venue import Venue
from datetime import datetime, timedelta


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()


@pytest.fixture
def setup_data(client):
    """Create test data for musician endpoints"""
    with client.application.app_context():
        # Create musician
        musician = User(
            email='musician@test.com',
            name='Test Musician',
            role='musician',
            instrument='Guitar',
            city='Test City'
        )
        db.session.add(musician)
        
        # Create venue user and venue
        venue_user = User(
            email='venue@test.com',
            name='Test Venue User',
            role='venue',
            city='Test City'
        )
        db.session.add(venue_user)
        db.session.flush()
        
        venue = Venue(
            user_id=venue_user.id,
            name='Test Venue',
            location='Test Location'
        )
        db.session.add(venue)
        
        # Create ensemble with musician as leader
        ensemble = Ensemble(
            leader_id=musician.id,
            name='Test Ensemble'
        )
        db.session.add(ensemble)
        db.session.flush()
        
        # Create past gig (accepted)
        past_gig = Gig(
            venue_id=venue.id,
            title='Past Gig',
            date_time=datetime.utcnow() - timedelta(days=2),
            description='Test past gig',
            status='accepted'
        )
        db.session.add(past_gig)
        db.session.flush()
        
        # Create accepted application
        past_app = GigApplication(
            gig_id=past_gig.id,
            ensemble_id=ensemble.id,
            status='accepted'
        )
        db.session.add(past_app)
        
        # Create future gig (accepted)
        future_gig = Gig(
            venue_id=venue.id,
            title='Future Gig',
            date_time=datetime.utcnow() + timedelta(days=7),
            description='Test future gig',
            status='accepted'
        )
        db.session.add(future_gig)
        db.session.flush()
        
        future_app = GigApplication(
            gig_id=future_gig.id,
            ensemble_id=ensemble.id,
            status='accepted'
        )
        db.session.add(future_app)
        
        db.session.commit()
        
        return {
            'musician': musician,
            'ensemble': ensemble,
            'past_gig': past_gig,
            'past_app': past_app,
            'future_gig': future_gig,
            'future_app': future_app
        }


def test_get_my_gigs_musician(client, setup_data):
    """Test /gigs/my-gigs endpoint for musicians"""
    with client.application.app_context():
        musician = User.query.filter_by(email='musician@test.com').first()
        musician_id = musician.id
    
    response = client.get(
        '/api/gigs/my-gigs',
        headers={'X-User-Id': str(musician_id)}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'gigs' in data
    assert len(data['gigs']) == 2  # Both accepted gigs
    assert data['role'] == 'musician'
    
    # Check gig data structure
    gig = data['gigs'][0]
    assert 'id' in gig
    assert 'application_id' in gig
    assert 'title' in gig
    assert 'date_time' in gig
    assert 'venue_name' in gig
    assert 'ensemble_name' in gig
    assert 'can_mark_completed' in gig


def test_get_my_gigs_no_auth(client, setup_data):
    """Test /gigs/my-gigs requires authentication"""
    response = client.get('/api/gigs/my-gigs')
    
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_mark_ensemble_completed(client, setup_data):
    """Test marking gig as completed from ensemble side"""
    with client.application.app_context():
        past_app = GigApplication.query.join(Gig).filter(
            Gig.title == 'Past Gig'
        ).first()
        app_id = past_app.id
    
    response = client.put(
        f'/api/gigs/applications/{app_id}/mark-ensemble-completed',
        headers={'Content-Type': 'application/json'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    
    # Verify the application was updated
    with client.application.app_context():
        app = GigApplication.query.get(app_id)
        assert app.gig_happened_ensemble == True


def test_mark_ensemble_completed_future_gig(client, setup_data):
    """Test cannot mark future gig as completed"""
    with client.application.app_context():
        future_app = GigApplication.query.join(Gig).filter(
            Gig.title == 'Future Gig'
        ).first()
        app_id = future_app.id
    
    response = client.put(
        f'/api/gigs/applications/{app_id}/mark-ensemble-completed',
        headers={'Content-Type': 'application/json'}
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_get_musician_history(client, setup_data):
    """Test /history/musician endpoint"""
    with client.application.app_context():
        musician = User.query.filter_by(email='musician@test.com').first()
        musician_id = musician.id
    
    response = client.get(
        '/api/history/musician',
        headers={'X-User-Id': str(musician_id)}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'history' in data
    assert 'verified_count' in data
    
    # Should have 2 accepted gigs in history
    assert len(data['history']) == 2


def test_venue_cannot_access_musician_history(client, setup_data):
    """Test venue users cannot access musician history"""
    with client.application.app_context():
        venue_user = User.query.filter_by(role='venue').first()
        
        response = client.get(
            '/api/history/musician',
            headers={'X-User-Id': str(venue_user.id)}
        )
        
        assert response.status_code == 403


def test_get_my_gigs_musician_no_ensembles(client):
    """Test musician with no ensembles gets empty gig list"""
    with client.application.app_context():
        musician = User(
            email='solo@test.com',
            name='Solo Musician',
            role='musician',
            instrument='Piano',
            city='Test City'
        )
        db.session.add(musician)
        db.session.commit()
        musician_id = musician.id
    
    response = client.get(
        '/api/gigs/my-gigs',
        headers={'X-User-Id': str(musician_id)}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['gigs'] == []
    assert data['role'] == 'musician'
