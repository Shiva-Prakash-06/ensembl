"""
Phase 5 Tests: Workflow Integrity & Analytics

Tests for:
1. Gig workflow status transitions (open -> accepted -> completed)
2. Pro subscription flag (admin toggle)
3. Analytics endpoints (Pro-gated)
"""

import pytest
from app import create_app
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.gig import Gig, GigApplication
from datetime import datetime, timedelta


@pytest.fixture
def app():
    """Create test app"""
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
def test_data(app):
    """Create test data - returns a function that retrieves IDs within app context"""
    with app.app_context():
        # Admin
        admin = User(
            email='admin@test.com',
            name='Admin',
            role='admin',
            google_id='admin123',
            city='Test City',
            is_pro=False
        )
        db.session.add(admin)
        
        # Pro Musician
        musician_pro = User(
            email='musician_pro@test.com',
            name='Pro Musician',
            role='musician',
            google_id='musician_pro123',
            city='Test City',
            instrument='Guitar',
            is_pro=True
        )
        db.session.add(musician_pro)
        
        # Free Musician
        musician_free = User(
            email='musician_free@test.com',
            name='Free Musician',
            role='musician',
            google_id='musician_free123',
            city='Test City',
            instrument='Drums',
            is_pro=False
        )
        db.session.add(musician_free)
        
        # Pro Venue
        venue_user_pro = User(
            email='venue_pro@test.com',
            name='Pro Venue',
            role='venue',
            google_id='venue_pro123',
            city='Test City',
            is_pro=True
        )
        db.session.add(venue_user_pro)
        
        # Free Venue
        venue_user_free = User(
            email='venue_free@test.com',
            name='Free Venue',
            role='venue',
            google_id='venue_free123',
            city='Test City',
            is_pro=False
        )
        db.session.add(venue_user_free)
        
        db.session.flush()
        
        # Venue profiles
        venue_pro = Venue(
            user_id=venue_user_pro.id,
            name='Pro Venue',
            location='123 Test St',
            verified_gig_count=5
        )
        db.session.add(venue_pro)
        
        venue_free = Venue(
            user_id=venue_user_free.id,
            name='Free Venue',
            location='456 Test Ave',
            verified_gig_count=2
        )
        db.session.add(venue_free)
        
        db.session.flush()
        
        # Ensemble
        ensemble = Ensemble(
            name='Test Ensemble',
            leader_id=musician_pro.id,
            verified_gig_count=3
        )
        db.session.add(ensemble)
        ensemble.members.append(musician_pro)
        ensemble.members.append(musician_free)
        
        db.session.commit()
        
        # Store IDs instead of objects
        ids = {
            'admin_id': admin.id,
            'musician_pro_id': musician_pro.id,
            'musician_free_id': musician_free.id,
            'venue_user_pro_id': venue_user_pro.id,
            'venue_user_free_id': venue_user_free.id,
            'venue_pro_id': venue_pro.id,
            'venue_free_id': venue_free.id,
            'ensemble_id': ensemble.id
        }
        
    return ids


# ===== PART 1: GIG WORKFLOW STATUS TESTS =====

def test_gig_created_with_open_status(app, client, test_data):
    """Test that new gigs are created with status='open'"""
    ids = test_data
    
    response = client.post('/api/gigs/', json={
        'venue_id': ids['venue_pro_id'],
        'title': 'Test Gig',
        'date_time': (datetime.utcnow() + timedelta(days=7)).isoformat(),
        'description': 'Test description',
        'payment_description': '$100'
    })
    
    assert response.status_code == 201
    gig_data = response.get_json()['gig']
    assert gig_data['status'] == 'open'
    assert gig_data['is_open'] == True
    assert gig_data['completed_at'] is None


def test_gig_status_changes_to_accepted(app, client, test_data):
    """Test that accepting an application changes gig status to 'accepted'"""
    ids = test_data
    
    with app.app_context():
        # Create gig
        gig = Gig(
            venue_id=ids['venue_pro_id'],
            title='Test Gig',
            date_time=datetime.utcnow() + timedelta(days=7),
            description='Test',
            status='open'
        )
        db.session.add(gig)
        db.session.flush()
        gig_id = gig.id  # Save ID before commit
        
        # Create application
        app_obj = GigApplication(
            gig_id=gig_id,
            ensemble_id=ids['ensemble_id'],
            status='pending'
        )
        db.session.add(app_obj)
        db.session.commit()
        app_id = app_obj.id
    
    # Accept application
    response = client.put(f'/api/gigs/applications/{app_id}/accept',
                         headers={'X-User-Id': str(ids['admin_id'])})
    
    assert response.status_code == 200
    
    # Check gig status changed
    with app.app_context():
        updated_gig = Gig.query.get(gig_id)
        assert updated_gig.status == 'accepted'
        assert updated_gig.is_open == False


def test_mark_gig_completed_success(app, client, test_data):
    """Test marking an accepted gig as completed after gig date"""
    ids = test_data
    
    with app.app_context():
        # Create past gig with accepted status
        past_date = datetime.utcnow() - timedelta(days=2)
        gig = Gig(
            venue_id=ids['venue_pro_id'],
            title='Past Gig',
            date_time=past_date,
            description='Test',
            status='accepted',
            is_open=False
        )
        db.session.add(gig)
        db.session.commit()
        gig_id = gig.id
    
    # Mark as completed
    response = client.put(f'/api/gigs/{gig_id}/mark-completed')
    
    assert response.status_code == 200
    result = response.get_json()
    assert result['gig']['status'] == 'completed'
    assert result['gig']['completed_at'] is not None


def test_mark_gig_completed_fails_before_date(app, client, test_data):
    """Test that marking as completed fails if gig date hasn't passed"""
    ids = test_data
    
    with app.app_context():
        # Create future gig
        future_date = datetime.utcnow() + timedelta(days=2)
        gig = Gig(
            venue_id=ids['venue_pro_id'],
            title='Future Gig',
            date_time=future_date,
            description='Test',
            status='accepted'
        )
        db.session.add(gig)
        db.session.commit()
        gig_id = gig.id
    
    # Try to mark as completed
    response = client.put(f'/api/gigs/{gig_id}/mark-completed')
    
    assert response.status_code == 400
    assert 'before gig date' in response.get_json()['error'].lower()


def test_mark_gig_completed_fails_if_not_accepted(app, client, test_data):
    """Test that only accepted gigs can be marked as completed"""
    ids = test_data
    
    with app.app_context():
        # Create past gig that's still open
        past_date = datetime.utcnow() - timedelta(days=2)
        gig = Gig(
            venue_id=ids['venue_pro_id'],
            title='Past Open Gig',
            date_time=past_date,
            description='Test',
            status='open'
        )
        db.session.add(gig)
        db.session.commit()
        gig_id = gig.id
    
    # Try to mark as completed
    response = client.put(f'/api/gigs/{gig_id}/mark-completed')
    
    assert response.status_code == 400
    assert 'accepted' in response.get_json()['error'].lower()


# ===== PART 2: PRO SUBSCRIPTION FLAG TESTS =====

def test_user_defaults_to_free(client, test_data):
    """Test that new users default to is_pro=False"""
    user = User(
        email='newuser@test.com',
        name='New User',
        role='musician',
        google_id='new123',
        city='Test City',
        instrument='Piano'
    )
    db.session.add(user)
    db.session.commit()
    
    assert user.is_pro == False


def test_admin_toggle_pro_status(app, client, test_data):
    """Test admin can toggle Pro status"""
    ids = test_data
    
    # Toggle to Pro
    response = client.post(f'/api/admin/users/{ids["musician_free_id"]}/toggle-pro',
                          headers={'X-User-Id': str(ids['admin_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    assert result['is_pro'] == True
    
    # Toggle back to Free
    response = client.post(f'/api/admin/users/{ids["musician_free_id"]}/toggle-pro',
                          headers={'X-User-Id': str(ids['admin_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    assert result['is_pro'] == False


def test_non_admin_cannot_toggle_pro(app, client, test_data):
    """Test that non-admin users cannot toggle Pro status"""
    ids = test_data
    
    # Try as non-admin musician
    response = client.post(f'/api/admin/users/{ids["musician_free_id"]}/toggle-pro',
                          headers={'X-User-Id': str(ids['musician_pro_id'])})
    
    assert response.status_code == 403


def test_user_to_dict_includes_is_pro(app, test_data):
    """Test that user.to_dict() includes is_pro field"""
    ids = test_data
    
    with app.app_context():
        musician_pro = User.query.get(ids['musician_pro_id'])
        user_dict = musician_pro.to_dict()
        
        assert 'is_pro' in user_dict
        assert user_dict['is_pro'] == True


# ===== PART 3: ANALYTICS TESTS =====

def test_musician_analytics_pro_user(client, test_data):
    """Test Pro musician gets full analytics"""
    ids = test_data
    
    response = client.get('/api/analytics/musician',
                         headers={'X-User-Id': str(ids['musician_pro_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    
    assert result['is_pro'] == True
    assert 'overview' in result
    assert 'genres' in result
    assert 'timeline' in result
    assert 'collaborators' in result
    assert 'top_venues' in result
    assert 'pro_teaser' not in result


def test_musician_analytics_free_user(app, client, test_data):
    """Test Free musician gets limited preview + teaser"""
    ids = test_data
    
    response = client.get('/api/analytics/musician',
                         headers={'X-User-Id': str(ids['musician_free_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    
    assert result['is_pro'] == False
    assert 'preview' in result
    assert 'pro_teaser' in result
    assert 'overview' not in result  # Full analytics not included


def test_venue_analytics_pro_user(app, client, test_data):
    """Test Pro venue gets full analytics"""
    ids = test_data
    
    response = client.get('/api/analytics/venue',
                         headers={'X-User-Id': str(ids['venue_user_pro_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    
    assert result['is_pro'] == True
    assert 'overview' in result
    assert 'genres' in result
    assert 'timeline' in result
    assert 'top_ensembles' in result


def test_venue_analytics_free_user(app, client, test_data):
    """Test Free venue gets limited preview + teaser"""
    ids = test_data
    
    response = client.get('/api/analytics/venue',
                         headers={'X-User-Id': str(ids['venue_user_free_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    
    assert result['is_pro'] == False
    assert 'preview' in result
    assert 'pro_teaser' in result


def test_musician_cannot_access_venue_analytics(app, client, test_data):
    """Test musicians cannot access venue analytics"""
    ids = test_data
    
    response = client.get('/api/analytics/venue',
                         headers={'X-User-Id': str(ids['musician_pro_id'])})
    
    assert response.status_code == 403


def test_venue_cannot_access_musician_analytics(app, client, test_data):
    """Test venues cannot access musician analytics"""
    ids = test_data
    
    response = client.get('/api/analytics/musician',
                         headers={'X-User-Id': str(ids['venue_user_pro_id'])})
    
    assert response.status_code == 403


def test_analytics_requires_authentication(client):
    """Test analytics endpoints require authentication"""
    response = client.get('/api/analytics/musician')
    assert response.status_code == 401
    
    response = client.get('/api/analytics/venue')
    assert response.status_code == 401


# ===== INTEGRATION TESTS =====

def test_complete_workflow_integration(app, client, test_data):
    """Test complete gig workflow: open -> accepted -> completed"""
    ids = test_data
    
    with app.app_context():
        # 1. Create gig (should be open)
        gig = Gig(
            venue_id=ids['venue_pro_id'],
            title='Integration Test Gig',
            date_time=datetime.utcnow() - timedelta(days=1),  # Past date
            description='Test',
            status='open'
        )
        db.session.add(gig)
        db.session.flush()
        
        assert gig.status == 'open'
        assert gig.is_open == True
        assert gig.completed_at is None
        
        # 2. Create and accept application (should move to accepted)
        app_obj = GigApplication(
            gig_id=gig.id,
            ensemble_id=ids['ensemble_id'],
            status='pending'
        )
        db.session.add(app_obj)
        db.session.commit()
        gig_id = gig.id
        app_id = app_obj.id
    
    response = client.put(f'/api/gigs/applications/{app_id}/accept')
    assert response.status_code == 200
    
    with app.app_context():
        gig = Gig.query.get(gig_id)
        assert gig.status == 'accepted'
        assert gig.is_open == False
    
    # 3. Mark as completed (should move to completed)
    response = client.put(f'/api/gigs/{gig_id}/mark-completed')
    assert response.status_code == 200
    
    with app.app_context():
        gig = Gig.query.get(gig_id)
        assert gig.status == 'completed'
        assert gig.completed_at is not None


def test_pro_analytics_with_real_data(app, client, test_data):
    """Test analytics with actual gig data"""
    ids = test_data
    
    with app.app_context():
        # Create completed gigs
        for i in range(3):
            gig = Gig(
                venue_id=ids['venue_pro_id'],
                title=f'Jazz Night {i}',
                date_time=datetime.utcnow() - timedelta(days=30 + i),
                description='Test',
                status='completed',
                completed_at=datetime.utcnow() - timedelta(days=29 + i)
            )
            db.session.add(gig)
            db.session.flush()
            
            app_obj = GigApplication(
                gig_id=gig.id,
                ensemble_id=ids['ensemble_id'],
                status='accepted',
                gig_happened_venue=True,
                gig_happened_ensemble=True,
                confirmed_at=datetime.utcnow() - timedelta(days=29 + i)
            )
            db.session.add(app_obj)
        
        db.session.commit()
    
    # Get Pro musician analytics
    response = client.get('/api/analytics/musician',
                         headers={'X-User-Id': str(ids['musician_pro_id'])})
    
    assert response.status_code == 200
    result = response.get_json()
    
    assert result['is_pro'] == True
    assert 'overview' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
