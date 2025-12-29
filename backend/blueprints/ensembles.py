"""
Ensembles Blueprint
Project container for groups of musicians
"""

from flask import Blueprint, request, jsonify
from database import db
from models.ensemble import Ensemble
from models.user import User
from models.message import Message 

ensembles_bp = Blueprint('ensembles', __name__)

# ... (Previous create, get, invite routes remain the same) ...
# ... (COPY THE PREVIOUS ROUTES HERE IF NEEDED, OR JUST UPDATE THE REMOVE_INVITE FUNCTION BELOW) ...

@ensembles_bp.route('/', methods=['POST'])
def create_ensemble():
    data = request.json
    required = ['name', 'leader_id']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    leader = User.query.get(data['leader_id'])
    if not leader:
        return jsonify({'error': 'Leader not found'}), 404
    ensemble = Ensemble(name=data['name'], leader_id=data['leader_id'])
    ensemble.members.append(leader)
    db.session.add(ensemble)
    db.session.commit()
    return jsonify({'message': 'Ensemble created', 'ensemble': ensemble.to_dict()}), 201

@ensembles_bp.route('/<int:ensemble_id>', methods=['GET'])
def get_ensemble(ensemble_id):
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    return jsonify(ensemble.to_dict()), 200

@ensembles_bp.route('/<int:ensemble_id>/invite', methods=['POST'])
def invite_member(ensemble_id):
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    data = request.json
    user = User.query.get(data.get('user_id'))
    if not user: return jsonify({'error': 'User not found'}), 404
    if user in ensemble.members: return jsonify({'error': 'User already in ensemble'}), 409
    if user in ensemble.invited_users: return jsonify({'error': 'User already invited'}), 409
    
    ensemble.invited_users.append(user)
    
    invite_msg = Message(
        sender_id=ensemble.leader_id,
        receiver_id=user.id,
        content=f"Invited you to join '{ensemble.name}'",
        msg_type='invite',
        related_id=ensemble.id,
        invite_status='pending'
    )
    db.session.add(invite_msg)
    db.session.commit()
    return jsonify({'message': 'Invite sent', 'ensemble': ensemble.to_dict()}), 200

@ensembles_bp.route('/<int:ensemble_id>/accept', methods=['POST'])
def accept_invite(ensemble_id):
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    data = request.json
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    
    invite_msg = Message.query.filter_by(
        receiver_id=user_id,
        related_id=ensemble_id,
        msg_type='invite'
    ).order_by(Message.created_at.desc()).first()
    
    if invite_msg:
        invite_msg.invite_status = 'accepted'

    if user in ensemble.invited_users:
        ensemble.invited_users.remove(user)
        ensemble.members.append(user)
        
        confirm_msg = Message(
            sender_id=user.id,
            receiver_id=ensemble.leader_id,
            content=f"Accepted your invite to '{ensemble.name}'",
            msg_type='text' 
        )
        db.session.add(confirm_msg)
        db.session.commit()
        return jsonify({'message': 'Invite accepted', 'ensemble': ensemble.to_dict()}), 200
    
    elif user in ensemble.members:
         db.session.commit() 
         return jsonify({'message': 'Already a member', 'ensemble': ensemble.to_dict()}), 200

    return jsonify({'error': 'No invite found'}), 400

# --- UPDATED FUNCTION ---
@ensembles_bp.route('/<int:ensemble_id>/invites/<int:user_id>', methods=['DELETE'])
def remove_invite(ensemble_id, user_id):
    """
    Remove an invite.
    If 'requester_id' matches 'user_id', it means the user DECLINED.
    We notify the leader in that case.
    """
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    # 1. Update the original invite message status to 'declined'
    invite_msg = Message.query.filter_by(
        receiver_id=user_id,
        related_id=ensemble_id,
        msg_type='invite'
    ).order_by(Message.created_at.desc()).first()

    if invite_msg:
        invite_msg.invite_status = 'declined'

    # 2. Check who is performing the action
    requester_id = request.args.get('requester_id', type=int)
    
    # If the Invitee is the one declining (Requester == User being removed)
    if requester_id == user_id:
        # Send notification to Leader
        decline_notification = Message(
            sender_id=user.id,
            receiver_id=ensemble.leader_id,
            content=f"Declined your invite to '{ensemble.name}'",
            msg_type='text'
        )
        db.session.add(decline_notification)

    # 3. Remove from invited list
    if user in ensemble.invited_users:
        ensemble.invited_users.remove(user)
        
    db.session.commit()
    return jsonify({'message': 'Invite declined'}), 200
# ------------------------

@ensembles_bp.route('/<int:ensemble_id>/members/<int:user_id>', methods=['DELETE'])
def remove_member(ensemble_id, user_id):
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    
    user = User.query.get(user_id)
    if not user or user not in ensemble.members:
        return jsonify({'error': 'User not in ensemble'}), 404
    
    requester_id = request.args.get('requester_id', type=int)
    
    if requester_id == user_id:
        notification_msg = Message(
            sender_id=user.id,
            receiver_id=ensemble.leader_id,
            content=f"{user.name} has left the ensemble '{ensemble.name}'.",
            msg_type='text'
        )
    else:
        notification_msg = Message(
            sender_id=ensemble.leader_id,
            receiver_id=user.id,
            content=f"You have been removed from the ensemble '{ensemble.name}'.",
            msg_type='text'
        )

    db.session.add(notification_msg)
    ensemble.members.remove(user)
    db.session.commit()
    return jsonify({'message': 'Member removed and notified'}), 200

@ensembles_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_ensembles(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    ensembles = user.ensembles.all()
    return jsonify({'ensembles': [e.to_dict() for e in ensembles]}), 200