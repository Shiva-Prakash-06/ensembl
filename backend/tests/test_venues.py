"""
Test Venue Endpoints
"""
import pytest
from database import db
from models.venue import Venue


class TestVenues:
    """Test venue functionality"""
    
    def test_create_venue(self, client, app, venue_user):
        """Test creating a venue profile"""
        data = {
            'user_id': venue_user,
            'name': 'The Music Hall',
            'location': '123 Music St, San Francisco',
            'tech_specs': 'PA System, Stage Lighting'
        }
        response = client.post('/api/venues/', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['venue']['user_id'] == venue_user
        assert json_data['venue']['name'] == 'The Music Hall'
    
    def test_get_all_venues(self, client, app, venue_user):
        """Test getting all venues"""
        # Create a venue first
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Jazz Club',
                location='456 Jazz Ave, Oakland'
            )
            db.session.add(venue)
            db.session.commit()
        
        response = client.get('/api/venues/')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data['venues'], list)
        assert len(data['venues']) > 0
    
    def test_get_venue_by_id(self, client, app, venue_user):
        """Test getting specific venue"""
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Blues Bar',
                location='789 Blues Blvd, Berkeley'
            )
            db.session.add(venue)
            db.session.commit()
            venue_id = venue.id
        
        response = client.get(f'/api/venues/{venue_id}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == venue_id
    
    def test_get_venue_by_user(self, client, app, venue_user):
        """Test getting venue by user ID"""
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Rock Arena',
                location='321 Rock Rd, San Jose'
            )
            db.session.add(venue)
            db.session.commit()
        
        response = client.get(f'/api/venues/user/{venue_user}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['user_id'] == venue_user
    
    def test_update_venue(self, client, app, venue_user):
        """Test updating venue details"""
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Funk House',
                location='555 Funk St, Oakland'
            )
            db.session.add(venue)
            db.session.commit()
            venue_id = venue.id
        
        data = {
            'description': 'Updated venue description',
            'tech_specs': 'Updated amenities'
        }
        response = client.put(f'/api/venues/{venue_id}', json=data)
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['venue']['description'] == 'Updated venue description'
    
    def test_delete_venue(self, client, app, venue_user):
        """Test deleting a venue"""
        # SKIP: No DELETE /api/venues/<id> endpoint exists
        pass
