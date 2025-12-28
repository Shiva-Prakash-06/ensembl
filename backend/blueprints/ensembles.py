"""
Ensembles Blueprint
Project container for groups of musicians
"""

from flask import Blueprint, request, jsonify
from database import db
from models.ensemble import Ensemble
from models.user import User

ensembles_bp = Blueprint('ensembles', __name__)


@ensembles_bp.route('/', methods=['POST'])
def create_ensemble():
    """
    Create an ensemble from existing connections
    Leader adds members manually
    """
    data = request.json
    
    required = ['name', 'leader_id', 'member_ids']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify leader exists
    leader = User.query.get(data['leader_id'])
    if not leader:
        return jsonify({'error': 'Leader not found'}), 404
    
    # Create ensemble
    ensemble = Ensemble(
        name=data['name'],
        leader_id=data['leader_id']
    )
    
    # Add members (including leader)
    member_ids = set(data['member_ids'])
    member_ids.add(data['leader_id'])  # Ensure leader is a member
    
    for member_id in member_ids:
        user = User.query.get(member_id)
        if user:
            ensemble.members.append(user)
    
    db.session.add(ensemble)
    db.session.commit()
    
    return jsonify({
        'message': 'Ensemble created',
        'ensemble': ensemble.to_dict()
    }), 201


@ensembles_bp.route('/<int:ensemble_id>', methods=['GET'])
def get_ensemble(ensemble_id):
    """Get ensemble details"""
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    
    return jsonify(ensemble.to_dict()), 200


@ensembles_bp.route('/<int:ensemble_id>/members', methods=['POST'])
def add_member(ensemble_id):
    """Add a member to an ensemble"""
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    
    data = request.json
    user_id = data.get('user_id')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user in ensemble.members:
        return jsonify({'error': 'User already in ensemble'}), 409
    
    ensemble.members.append(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Member added',
        'ensemble': ensemble.to_dict()
    }), 200


@ensembles_bp.route('/<int:ensemble_id>/members/<int:user_id>', methods=['DELETE'])
def remove_member(ensemble_id, user_id):
    """Remove a member from an ensemble"""
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    
    user = User.query.get(user_id)
    if not user or user not in ensemble.members:
        return jsonify({'error': 'User not in ensemble'}), 404
    
    ensemble.members.remove(user)
    db.session.commit()
    
    return jsonify({'message': 'Member removed'}), 200


@ensembles_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_ensembles(user_id):
    """Get all ensembles a user is part of"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    ensembles = user.ensembles.all()
    
    return jsonify({
        'ensembles': [e.to_dict() for e in ensembles]
    }), 200
