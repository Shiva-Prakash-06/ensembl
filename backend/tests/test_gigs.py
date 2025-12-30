"""
Test Gig Endpoints
"""
import pytest
from database import db
from models.gig import Gig
from models.venue import Venue
from datetime import datetime


class TestGigs:
    """Test gig functionality"""
    
    def test_create_gig(self, client, app, venue_user):
        """Test creating a gig posting"""
        # Create venue first
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Concert Hall',
                location='123 Music Ave, Downtown'
            )
            db.session.add(venue)
            db.session.commit()
            venue_id = venue.id
        
        data = {
            'venue_id': venue_id,
            'title': 'New Year Jazz Gig',
            'date_time': '2025-12-31T20:00:00',
            'description': 'Jazz ensemble, 4 piece',
            'payment_description': '$500'
        }
        response = client.post('/api/gigs/', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['gig']['title'] == 'New Year Jazz Gig'
        assert json_data['gig']['payment_description'] == '$500'
    
    def test_get_all_gigs(self, client, app, venue_user):
        """Test getting all gigs"""
        # Create venue and gig
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Venue 1',
                location='456 Gig St, SF'
            )
            db.session.add(venue)
            db.session.commit()
            
            gig = Gig(
                venue_id=venue.id,
                title='Test Gig',
                date_time=datetime(2025, 12, 31),
                description='Description',
                payment_description='$300'
            )
            db.session.add(gig)
            db.session.commit()
        
        response = client.get('/api/gigs/')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data['gigs'], list)
        assert len(data['gigs']) > 0
    
    def test_apply_to_gig(self, client, app, venue_user, ensemble):
        """Test ensemble applying to a gig"""
        # Create venue and gig
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Apply Venue',
                location='789 Apply Rd, Oakland'
            )
            db.session.add(venue)
            db.session.commit()
            
            gig = Gig(
                venue_id=venue.id,
                title='Gig for Apply Test',
                date_time=datetime(2026, 1, 15),
                description='Need a band',
                payment_description='$400'
            )
            db.session.add(gig)
            db.session.commit()
            gig_id = gig.id
        
        data = {'ensemble_id': ensemble}
        response = client.post(f'/api/gigs/{gig_id}/apply', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['application']['gig_id'] == gig_id
        assert json_data['application']['ensemble']['id'] == ensemble
    
    def test_confirm_gig_happened(self, client, app, venue_user, ensemble):
        """Test dual confirmation system for gig completion"""
        # Create gig and application
        with app.app_context():
            venue = Venue(
                user_id=venue_user,
                name='Confirm Venue',
                location='321 Confirm Ave, Berkeley'
            )
            db.session.add(venue)
            db.session.commit()
            
            gig = Gig(
                venue_id=venue.id,
                title='Confirm Test Gig',
                date_time=datetime(2025, 12, 1),
                description='Band needed',
                payment_description='$250'
            )
            db.session.add(gig)
            db.session.commit()
            gig_id = gig.id
        
        # Apply to gig
        apply_response = client.post(f'/api/gigs/{gig_id}/apply', json={'ensemble_id': ensemble})
        application_id = apply_response.get_json()['application']['id']
        
        # Venue confirms
        response = client.put(
            f'/api/gigs/applications/{application_id}/confirm',
            json={'confirmer_role': 'venue', 'gig_happened': True}
        )
        assert response.status_code == 200
        
        # Ensemble confirms
        response = client.put(
            f'/api/gigs/applications/{application_id}/confirm',
            json={'confirmer_role': 'ensemble', 'gig_happened': True}
        )
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data.get('both_confirmed') == True
