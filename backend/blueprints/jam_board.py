"""
Jam Board Blueprint
"Looking For" posts - the homepage feed
"""

from flask import Blueprint, request, jsonify
from database import db
from models.jam_post import JamPost
from models.user import User

jam_board_bp = Blueprint('jam_board', __name__)


@jam_board_bp.route('/', methods=['GET'])
def get_jam_posts():
    """
    Get all active jam posts for the feed (GLOBAL - all users)
    Sorted by most recent first
    Optional filters: location, instrument
    """
    # Optional filters
    location = request.args.get('location')
    instrument = request.args.get('instrument')
    
    # Query ALL active jam posts (multi-user global feed)
    query = JamPost.query.filter_by(is_active=True)
    
    if location:
        query = query.filter(JamPost.location.ilike(f'%{location}%'))
    if instrument:
        query = query.filter(JamPost.looking_for_instrument.ilike(f'%{instrument}%'))
    
    posts = query.order_by(JamPost.created_at.desc()).all()
    
    return jsonify({
        'posts': [post.to_dict() for post in posts]
    }), 200


@jam_board_bp.route('/', methods=['POST'])
def create_jam_post():
    """
    Create a new "Looking For" post
    ONLY musicians can create jam posts
    """
    data = request.json
    
    # Validate required fields
    required = ['author_id', 'looking_for_instrument', 'location', 'description']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify author exists and is a musician
    author = User.query.get(data['author_id'])
    if not author:
        return jsonify({'error': 'Author not found'}), 404
    
    if author.role != 'musician':
        return jsonify({'error': 'Only musicians can create jam posts'}), 403
    
    # Create post
    post = JamPost(
        author_id=data['author_id'],
        looking_for_instrument=data['looking_for_instrument'],
        location=data['location'],
        description=data['description'],
        genre=data.get('genre')
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Jam post created',
        'post': post.to_dict()
    }), 201


@jam_board_bp.route('/<int:post_id>', methods=['GET'])
def get_jam_post(post_id):
    """Get a single jam post by ID"""
    post = JamPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    return jsonify(post.to_dict()), 200


@jam_board_bp.route('/<int:post_id>', methods=['DELETE'])
def delete_jam_post(post_id):
    """
    Close/deactivate a jam post
    (Soft delete by setting is_active = False)
    """
    post = JamPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    post.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Post closed'}), 200
