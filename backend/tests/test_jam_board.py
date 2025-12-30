"""
Test Jam Board Endpoints
"""
import pytest
from database import db
from models.jam_post import JamPost
from models.user import User


class TestJamBoard:
    """Test jam board functionality"""
    
    def test_get_jam_posts(self, client, jam_post):
        """Test getting all jam posts"""
        response = client.get('/api/jam-board/')
        assert response.status_code == 200
        data = response.get_json()
        assert 'posts' in data
        assert isinstance(data['posts'], list)
        assert len(data['posts']) > 0
    
    def test_create_jam_post_musician(self, client, app, musician_user):
        """Test creating a jam post as a musician"""
        with app.app_context():
            user = User.query.get(musician_user)
            
        data = {
            'author_id': musician_user,
            'looking_for_instrument': 'Bass',
            'location': 'Los Angeles',
            'description': 'Looking for a bassist for jazz session',
            'genre': 'Jazz'
        }
        response = client.post('/api/jam-board/', json=data)
        assert response.status_code == 201
        json_data = response.get_json()
        assert 'post' in json_data
        assert json_data['post']['description'] == data['description']
        assert json_data['post']['looking_for_instrument'] == 'Bass'
    
    def test_create_jam_post_venue_rejected(self, client, app, venue_user):
        """Test that venues cannot create jam posts"""
        data = {
            'author_id': venue_user,
            'looking_for_instrument': 'Guitar',
            'location': 'New York',
            'description': 'Trying to post as venue'
        }
        response = client.post('/api/jam-board/', json=data)
        assert response.status_code == 403
    
    def test_raise_hand(self, client, app, jam_post, musician_user):
        """Test raising hand on a jam post"""
        # Create a second musician to raise hand
        with app.app_context():
            user2 = User(
                email='musician2@test.com',
                name='Musician 2',
                city='LA',
                role='musician',
                instrument='Bass'
            )
            db.session.add(user2)
            db.session.commit()
            user2_id = user2.id
        
        response = client.post(f'/api/jam-board/{jam_post}/raise-hand', json={'user_id': user2_id})
        assert response.status_code == 200
        
        # Verify the post shows interest
        with app.app_context():
            post = JamPost.query.get(jam_post)
            interested_ids = [u.id for u in post.interested_musicians.all()]
            assert user2_id in interested_ids
    
    def test_lower_hand(self, client, app, jam_post, musician_user):
        """Test lowering hand on a jam post"""
        # First raise hand
        with app.app_context():
            user2 = User(
                email='musician3@test.com',
                name='Musician 3',
                city='LA',
                role='musician',
                instrument='Drums'
            )
            db.session.add(user2)
            db.session.commit()
            user2_id = user2.id
            
            post = JamPost.query.get(jam_post)
            post.interested_musicians.append(user2)
            db.session.commit()
        
        # Now lower hand by calling raise-hand again (it toggles)
        response = client.post(f'/api/jam-board/{jam_post}/raise-hand', json={'user_id': user2_id})
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['has_raised_hand'] == False  # Should be lowered now
        
        # Verify interest removed
        with app.app_context():
            post = JamPost.query.get(jam_post)
            interested_ids = [u.id for u in post.interested_musicians.all()]
            assert user2_id not in interested_ids
    
    def test_delete_jam_post(self, client, jam_post):
        """Test deleting a jam post"""
        response = client.delete(f'/api/jam-board/{jam_post}')
        assert response.status_code == 200
