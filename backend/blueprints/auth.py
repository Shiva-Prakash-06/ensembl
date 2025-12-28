"""
Authentication Blueprint
Handles Google OAuth and Email login (mock for MVP)
"""

from flask import Blueprint, request, jsonify
from database import db
from models.user import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Mock Google OAuth login
    TODO: Integrate real Google OAuth flow
    """
    data = request.json
    google_id = data.get('google_id')
    email = data.get('email')
    name = data.get('name')
    
    # Check if user exists
    user = User.query.filter_by(google_id=google_id).first()
    
    if user:
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'is_new_user': False
        }), 200
    
    # New user - return flag to trigger onboarding
    return jsonify({
        'message': 'New user',
        'is_new_user': True,
        'google_id': google_id,
        'email': email,
        'name': name
    }), 200


@auth_bp.route('/email', methods=['POST'])
def email_login():
    """
    Mock email/password login
    TODO: Implement real authentication with password hashing
    """
    data = request.json
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'is_new_user': False
        }), 200
    
    return jsonify({'error': 'User not found'}), 404


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Complete signup with onboarding data
    Required fields depend on role:
    - Musicians: email, name, instrument, city
    - Venues: email, name, city
    """
    data = request.json
    
    # Validate required fields
    role = data.get('role', 'musician')  # Default to musician
    
    if role == 'musician':
        required = ['email', 'name', 'instrument', 'city']
    elif role == 'venue':
        required = ['email', 'name', 'city']
    else:
        return jsonify({'error': 'Invalid role'}), 400
    
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    existing = User.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    user = User(
        email=data['email'],
        name=data['name'],
        city=data['city'],
        role=role,
        google_id=data.get('google_id')
    )
    
    # Add musician-specific fields
    if role == 'musician':
        user.instrument = data['instrument']
        user.photo_url = data.get('photo_url')
        user.bio = data.get('bio')
        user.vibe_tags = data.get('vibe_tags')  # Comma-separated string
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Signup successful',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint
    TODO: Implement session/token invalidation
    """
    return jsonify({'message': 'Logged out successfully'}), 200
