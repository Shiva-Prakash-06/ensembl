"""
Venues Blueprint
Venue profiles and management
"""

from flask import Blueprint, request, jsonify
from database import db
from models.venue import Venue
from models.user import User

venues_bp = Blueprint('venues', __name__)


@venues_bp.route('/', methods=['GET'])
def get_venues():
    """Get all venues"""
    venues = Venue.query.all()
    return jsonify({
        'venues': [venue.to_dict() for venue in venues]
    }), 200


@venues_bp.route('/', methods=['POST'])
def create_venue():
    """
    Create a new venue profile
    User must have role='venue'
    """
    data = request.json
    
    required = ['user_id', 'name', 'location']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify user exists and is a venue
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'venue':
        return jsonify({'error': 'Only venue users can create venue profiles'}), 403
    
    # Check if user already has a venue profile
    existing = Venue.query.filter_by(user_id=data['user_id']).first()
    if existing:
        return jsonify({'error': 'User already has a venue profile'}), 409
    
    venue = Venue(
        user_id=data['user_id'],
        name=data['name'],
        location=data['location'],
        vibe_tags=data.get('vibe_tags'),
        tech_specs=data.get('tech_specs'),
        description=data.get('description')
    )
    
    db.session.add(venue)
    db.session.commit()
    
    return jsonify({
        'message': 'Venue created',
        'venue': venue.to_dict()
    }), 201


@venues_bp.route('/<int:venue_id>', methods=['GET'])
def get_venue(venue_id):
    """Get venue details"""
    venue = Venue.query.get(venue_id)
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
    return jsonify(venue.to_dict()), 200


@venues_bp.route('/user/<int:user_id>', methods=['GET'])
def get_venue_by_user(user_id):
    """Get venue profile for a specific user"""
    venue = Venue.query.filter_by(user_id=user_id).first()
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
    return jsonify(venue.to_dict()), 200


@venues_bp.route('/<int:venue_id>', methods=['PUT'])
def update_venue(venue_id):
    """Update venue profile"""
    venue = Venue.query.get(venue_id)
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
    data = request.json
    
    if 'name' in data:
        venue.name = data['name']
    if 'location' in data:
        venue.location = data['location']
    if 'vibe_tags' in data:
        venue.vibe_tags = data['vibe_tags']
    if 'tech_specs' in data:
        venue.tech_specs = data['tech_specs']
    if 'description' in data:
        venue.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Venue updated',
        'venue': venue.to_dict()
    }), 200
