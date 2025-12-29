"""
Jam Board Blueprint
"Looking For" posts - the homepage feed
"""

from flask import Blueprint, request, jsonify, session
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
    
    # Get current user ID to check "Hand Raised" status
    current_user_id = request.args.get('user_id')
    
    # Query ALL active jam posts (multi-user global feed)
    query = JamPost.query.filter_by(is_active=True)
    
    if location:
        query = query.filter(JamPost.location.ilike(f'%{location}%'))
    if instrument:
        query = query.filter(JamPost.looking_for_instrument.ilike(f'%{instrument}%'))
    
    posts = query.order_by(JamPost.created_at.desc()).all()
    
    return jsonify({
        'posts': [post.to_dict(current_user_id=current_user_id) for post in posts]
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
    
    # NEW: Handle if 'looking_for_instrument' is sent as an array (safety check)
    instruments = data['looking_for_instrument']
    if isinstance(instruments, list):
        instruments = ", ".join(instruments)
    
    # Create post
    post = JamPost(
        author_id=data['author_id'],
        looking_for_instrument=instruments, # Use the processed string
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

# NEW ROUTE: Toggle Raise Hand
@jam_board_bp.route('/<int:post_id>/raise-hand', methods=['POST'])
def raise_hand(post_id):
    """
    Toggle "Raise Hand" status for a user on a post
    """
    data = request.json
    user_id = data.get('user_id') # Expecting user_id in body
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400

    post = JamPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Logic: Toggle the hand raise
    if user in post.interested_musicians:
        post.interested_musicians.remove(user)
        action = "removed"
        has_raised = False
    else:
        post.interested_musicians.append(user)
        action = "added"
        has_raised = True

    db.session.commit()
    
    return jsonify({
        'message': f'Hand {action}', 
        'has_raised_hand': has_raised,
        'count': post.interested_musicians.count()
    }), 200


# NEW ROUTE: Get Interested Musicians
@jam_board_bp.route('/<int:post_id>/interested', methods=['GET'])
def get_interested_musicians(post_id):
    """
    Get the list of musicians who raised their hand for a specific post
    """
    post = JamPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Convert list of user objects to list of dicts
    interested = [user.to_dict() for user in post.interested_musicians]
    
    return jsonify({
        'post_id': post_id,
        'interested_musicians': interested
    }), 200


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