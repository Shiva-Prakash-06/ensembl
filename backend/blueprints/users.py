"""
Users Blueprint
Musician profile management
"""

from flask import Blueprint, request, jsonify
from database import db
from models.user import User

users_bp = Blueprint('users', __name__)


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile by ID"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Update user profile
    Can update: photo_url, media_embed, bio, vibe_tags, is_active
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    # Update allowed fields
    if 'photo_url' in data:
        user.photo_url = data['photo_url']
    if 'media_embed' in data:
        user.media_embed = data['media_embed']
    if 'bio' in data:
        user.bio = data['bio']
    if 'vibe_tags' in data:
        user.vibe_tags = data['vibe_tags']  # Comma-separated string
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated',
        'user': user.to_dict()
    }), 200


@users_bp.route('/search', methods=['GET'])
def search_users():
    """
    Search users by instrument, city, or vibe tags
    TODO: Add more advanced filtering if needed
    """
    instrument = request.args.get('instrument')
    city = request.args.get('city')
    is_active = request.args.get('is_active', 'true').lower() == 'true'
    
    query = User.query.filter_by(is_active=is_active)
    
    if instrument:
        query = query.filter(User.instrument.ilike(f'%{instrument}%'))
    if city:
        query = query.filter(User.city.ilike(f'%{city}%'))
    
    users = query.all()
    
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200
