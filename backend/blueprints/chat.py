"""
Chat Blueprint
Minimal 1-to-1 text messaging
"""

from flask import Blueprint, request, jsonify
from database import db
from models.message import Message
from models.user import User
from sqlalchemy import or_, and_

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/conversations/<int:user_id>', methods=['GET'])
def get_conversations(user_id):
    """
    Get all conversations for a user
    Returns list of users they've chatted with
    """
    # Find all users this person has messaged or been messaged by
    sent_to = db.session.query(Message.receiver_id).filter_by(sender_id=user_id).distinct()
    received_from = db.session.query(Message.sender_id).filter_by(receiver_id=user_id).distinct()
    
    # Combine and get unique user IDs
    conversation_ids = set()
    for (uid,) in sent_to:
        conversation_ids.add(uid)
    for (uid,) in received_from:
        conversation_ids.add(uid)
    
    # Get user details
    users = User.query.filter(User.id.in_(conversation_ids)).all()
    
    return jsonify({
        'conversations': [user.to_dict() for user in users]
    }), 200


@chat_bp.route('/messages/<int:user_id>/<int:other_user_id>', methods=['GET'])
def get_messages(user_id, other_user_id):
    """
    Get all messages between two users
    """
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
        )
    ).order_by(Message.created_at.asc()).all()
    
    return jsonify({
        'messages': [msg.to_dict() for msg in messages]
    }), 200


@chat_bp.route('/send', methods=['POST'])
def send_message():
    """
    Send a message from one user to another
    Triggered from Jam Board "raise hand" or direct messaging
    """
    data = request.json
    
    required = ['sender_id', 'receiver_id', 'content']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify users exist
    sender = User.query.get(data['sender_id'])
    receiver = User.query.get(data['receiver_id'])
    
    if not sender or not receiver:
        return jsonify({'error': 'User not found'}), 404
    
    # Create message
    message = Message(
        sender_id=data['sender_id'],
        receiver_id=data['receiver_id'],
        content=data['content']
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent',
        'data': message.to_dict()
    }), 201


@chat_bp.route('/mark-read/<int:message_id>', methods=['PUT'])
def mark_read(message_id):
    """Mark a message as read"""
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    message.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Marked as read'}), 200
