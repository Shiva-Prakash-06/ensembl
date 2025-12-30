"""
Test Authentication Endpoints
"""
import pytest
from database import db
from models.user import User


class TestAuth:
    """Test authentication functionality"""
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ok'
    
    def test_signup_musician(self, client):
        """Test musician signup"""
        data = {
            'email': 'newmusician@test.com',
            'name': 'New Musician',
            'city': 'New York',
            'role': 'musician',
            'instrument': 'Piano'
        }
        response = client.post('/api/auth/signup', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['user']['email'] == data['email']
        assert json_data['user']['role'] == 'musician'
    
    def test_signup_venue(self, client):
        """Test venue signup"""
        data = {
            'email': 'newvenue@test.com',
            'name': 'New Venue',
            'city': 'New York',
            'role': 'venue'
        }
        response = client.post('/api/auth/signup', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['user']['email'] == data['email']
        assert json_data['user']['role'] == 'venue'
    
    def test_signup_missing_fields(self, client):
        """Test signup with missing required fields"""
        data = {
            'email': 'incomplete@test.com',
            'name': 'Incomplete User'
            # Missing city and instrument for musician
        }
        response = client.post('/api/auth/signup', json=data)
        assert response.status_code == 400
    
    def test_signup_duplicate_email(self, client, musician_user):
        """Test signup with duplicate email"""
        data = {
            'email': 'musician@test.com',  # Already exists from fixture
            'name': 'Duplicate User',
            'city': 'Boston',
            'role': 'musician',
            'instrument': 'Bass'
        }
        response = client.post('/api/auth/signup', json=data)
        assert response.status_code == 409
    
    def test_email_login_existing_user(self, client, musician_user):
        """Test email login with existing user"""
        data = {'email': 'musician@test.com'}
        response = client.post('/api/auth/email', json=data)
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['is_new_user'] == False
        assert json_data['user']['email'] == 'musician@test.com'
    
    def test_email_login_nonexistent_user(self, client):
        """Test email login with nonexistent user"""
        data = {'email': 'nonexistent@test.com'}
        response = client.post('/api/auth/email', json=data)
        assert response.status_code == 404
    
    def test_google_login_existing_user(self, client, musician_user):
        """Test Google login with existing user"""
        data = {
            'google_id': 'test_google_musician',
            'email': 'musician@test.com',
            'name': 'Test Musician'
        }
        response = client.post('/api/auth/google', json=data)
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['is_new_user'] == False
    
    def test_google_login_new_user(self, client):
        """Test Google login with new user"""
        data = {
            'google_id': 'new_google_id',
            'email': 'newgoogle@test.com',
            'name': 'New Google User'
        }
        response = client.post('/api/auth/google', json=data)
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['is_new_user'] == True
