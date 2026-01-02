"""
Gigs Blueprint
Gig postings, applications, and the Gig Handshake flow
"""

from flask import Blueprint, request, jsonify
from database import db
from models.gig import Gig, GigApplication
from models.venue import Venue
from models.ensemble import Ensemble
from models.user import User
from models.message import Message # <--- Added Import
from datetime import datetime

gigs_bp = Blueprint('gigs', __name__)


# ===== GIG POSTINGS =====

@gigs_bp.route('/', methods=['GET'])
def get_gigs():
    """
    Get all open gigs
    Optional filters: location, date
    """
    location = request.args.get('location')
    is_open = request.args.get('is_open', 'true').lower() == 'true'
    
    query = Gig.query.filter_by(is_open=is_open)
    
    if location:
        query = query.join(Venue).filter(Venue.location.ilike(f'%{location}%'))
    
    gigs = query.order_by(Gig.date_time.asc()).all()
    
    return jsonify({
        'gigs': [gig.to_dict() for gig in gigs]
    }), 200


@gigs_bp.route('/', methods=['POST'])
def create_gig():
    """
    Create a new gig posting (by venue)
    Only venue users can create gigs
    """
    data = request.json
    
    required = ['venue_id', 'title', 'date_time', 'description']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify venue exists
    venue = Venue.query.get(data['venue_id'])
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
    # Parse date_time
    try:
        gig_date = datetime.fromisoformat(data['date_time'])
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    gig = Gig(
        venue_id=data['venue_id'],
        title=data['title'],
        date_time=gig_date,
        description=data['description'],
        payment_description=data.get('payment_description')
    )
    
    db.session.add(gig)
    db.session.commit()
    
    return jsonify({
        'message': 'Gig created',
        'gig': gig.to_dict()
    }), 201


@gigs_bp.route('/<int:gig_id>', methods=['GET'])
def get_gig(gig_id):
    """Get gig details"""
    gig = Gig.query.get(gig_id)
    if not gig:
        return jsonify({'error': 'Gig not found'}), 404
    
    return jsonify(gig.to_dict()), 200


# ===== GIG APPLICATIONS =====

@gigs_bp.route('/<int:gig_id>/apply', methods=['POST'])
def apply_to_gig(gig_id):
    """
    Ensemble applies to a gig (one-click application)
    """
    gig = Gig.query.get(gig_id)
    if not gig:
        return jsonify({'error': 'Gig not found'}), 404
    
    if not gig.is_open:
        return jsonify({'error': 'Gig is not accepting applications'}), 400
    
    data = request.json
    ensemble_id = data.get('ensemble_id')
    
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    
    # Check if already applied
    existing = GigApplication.query.filter_by(
        gig_id=gig_id,
        ensemble_id=ensemble_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Already applied to this gig'}), 409
    
    application = GigApplication(
        gig_id=gig_id,
        ensemble_id=ensemble_id,
        status='pending'
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'message': 'Application submitted',
        'application': application.to_dict()
    }), 201


@gigs_bp.route('/<int:gig_id>/applications', methods=['GET'])
def get_gig_applications(gig_id):
    """Get all applications for a gig (for venue to review)"""
    gig = Gig.query.get(gig_id)
    if not gig:
        return jsonify({'error': 'Gig not found'}), 404
    
    applications = gig.applications.all()
    
    return jsonify({
        'applications': [app.to_dict() for app in applications]
    }), 200


# ===== GIG HANDSHAKE =====

@gigs_bp.route('/applications/<int:application_id>/accept', methods=['PUT'])
def accept_application(application_id):
    """
    Venue accepts an ensemble's application
    1. Update status to 'accepted'
    2. Close the gig (is_open=False) and set gig status to 'accepted'
    3. Auto-create a chat message from Venue -> Ensemble Leader
    4. Return Leader ID for redirect
    """
    application = GigApplication.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # 1. Update Application Status
    application.status = 'accepted'
    
    # 2. Close the gig and update gig status (Phase 5)
    gig = application.gig
    gig.is_open = False
    gig.status = 'accepted'  # Phase 5: Gig moves to 'accepted' status

    # 3. Create Initial Chat Message (Venue Owner -> Ensemble Leader)
    venue_owner_id = gig.venue.user_id
    ensemble_leader_id = application.ensemble.leader_id

    # Check if we should create a greeting message
    # We do this so the conversation immediately appears in the Chat list
    start_msg = Message(
        sender_id=venue_owner_id,
        receiver_id=ensemble_leader_id,
        content=f"Application accepted for '{gig.title}'. Let's discuss details!",
        msg_type='text'
    )
    db.session.add(start_msg)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Application accepted! Chat opened.',
        'application': application.to_dict(),
        'chat_with_id': ensemble_leader_id # <--- Return this for the frontend
    }), 200


@gigs_bp.route('/<int:gig_id>/mark-completed', methods=['PUT'])
def mark_gig_completed(gig_id):
    """
    Phase 5: Venue marks gig as completed after the event
    Only available after gig date has passed
    Changes status from 'accepted' -> 'completed'
    This unlocks the handshake confirmation flow
    Also automatically confirms venue side (gig_happened_venue = True)
    """
    gig = Gig.query.get(gig_id)
    if not gig:
        return jsonify({'error': 'Gig not found'}), 404
    
    # Verify gig date has passed
    if gig.date_time > datetime.utcnow():
        return jsonify({'error': 'Cannot mark as completed before gig date'}), 400
    
    # Verify gig is in 'accepted' status (has a chosen ensemble)
    if gig.status != 'accepted':
        return jsonify({'error': 'Can only mark accepted gigs as completed'}), 400
    
    # Mark gig as completed
    gig.status = 'completed'
    gig.completed_at = datetime.utcnow()
    
    # Find the accepted application and mark venue's confirmation
    accepted_app = GigApplication.query.filter_by(
        gig_id=gig_id,
        status='accepted'
    ).first()
    
    if accepted_app:
        accepted_app.gig_happened_venue = True
        
        # If ensemble already confirmed, mark as fully verified
        if accepted_app.gig_happened_ensemble is not None:
            accepted_app.confirmed_at = datetime.utcnow()
            
            # If both confirmed YES, increment verified counts
            if accepted_app.gig_happened_venue and accepted_app.gig_happened_ensemble:
                venue = gig.venue
                venue.verified_gig_count += 1
                ensemble = accepted_app.ensemble
                ensemble.verified_gig_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Gig marked as completed',
        'gig': gig.to_dict()
    }), 200


@gigs_bp.route('/applications/<int:application_id>/reject', methods=['PUT'])
def reject_application(application_id):
    """Venue rejects an application"""
    application = GigApplication.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    application.status = 'rejected'
    db.session.commit()
    
    return jsonify({'message': 'Application rejected'}), 200


@gigs_bp.route('/applications/<int:application_id>/confirm', methods=['PUT'])
def confirm_gig_happened(application_id):
    """
    Post-gig confirmation: "Did this gig happen?"
    Both venue and ensemble leader must confirm
    If both confirm Yes, increment verified gig count for venue and all ensemble members
    """
    application = GigApplication.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    data = request.json
    confirmer_role = data.get('confirmer_role')  # 'venue' or 'ensemble'
    gig_happened = data.get('gig_happened', False)
    
    if confirmer_role == 'venue':
        application.gig_happened_venue = gig_happened
    elif confirmer_role == 'ensemble':
        application.gig_happened_ensemble = gig_happened
    else:
        return jsonify({'error': 'Invalid confirmer_role'}), 400
    
    # Check if both parties have confirmed
    if application.gig_happened_venue is not None and application.gig_happened_ensemble is not None:
        application.confirmed_at = datetime.utcnow()
        
        # If BOTH confirmed YES, increment verified gig counts
        if application.gig_happened_venue and application.gig_happened_ensemble:
            # Increment venue's verified gig count
            venue = application.gig.venue
            venue.verified_gig_count += 1
            
            # Increment ensemble's verified gig count
            ensemble = application.ensemble
            ensemble.verified_gig_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Gig confirmation recorded',
        'application': application.to_dict(),
        'both_confirmed': application.gig_happened_venue is not None and application.gig_happened_ensemble is not None,
        'verified': application.gig_happened_venue and application.gig_happened_ensemble if application.confirmed_at else False
    }), 200


# ===== GIG HISTORY =====

@gigs_bp.route('/history/venue/<int:venue_id>', methods=['GET'])
def get_venue_gig_history(venue_id):
    """
    Get gig history for a venue
    Returns all gigs (open, accepted, completed) with their applications
    """
    venue = Venue.query.get(venue_id)
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
    gigs = Gig.query.filter_by(venue_id=venue_id).order_by(Gig.date_time.desc()).all()
    
    history = []
    for gig in gigs:
        # Get the accepted application (if any)
        accepted_app = GigApplication.query.filter_by(
            gig_id=gig.id,
            status='accepted'
        ).first()
        
        gig_data = gig.to_dict()
        if accepted_app:
            gig_data['accepted_ensemble'] = {
                'id': accepted_app.ensemble.id,
                'name': accepted_app.ensemble.name,
                'leader_name': accepted_app.ensemble.leader.name,
                'members_count': len(accepted_app.ensemble.members)
            }
        
        history.append(gig_data)
    
    return jsonify({
        'venue': {
            'id': venue.id,
            'name': venue.name,
            'verified_gig_count': venue.verified_gig_count
        },
        'gigs': history,
        'stats': {
            'total': len(gigs),
            'completed': len([g for g in gigs if g.status == 'completed']),
            'active': len([g for g in gigs if g.status == 'accepted']),
            'open': len([g for g in gigs if g.status == 'open'])
        }
    }), 200


@gigs_bp.route('/my-gigs', methods=['GET'])
def get_my_gigs():
    """
    Get gigs for current user based on their role:
    - Musician: Gets all accepted gigs from ensembles they're part of
    - Venue: Gets all gigs they posted
    
    Returns gigs with status info for marking as completed
    """
    user_id = request.headers.get('X-User-Id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    gigs_data = []
    
    if user.role == 'musician':
        # Get all ensembles this musician is part of
        musician_ensembles = Ensemble.query.filter(
            (Ensemble.leader_id == user.id) | 
            (Ensemble.members.any(id=user.id))
        ).all()
        
        ensemble_ids = [e.id for e in musician_ensembles]
        
        if ensemble_ids:
            # Get all accepted applications for these ensembles
            applications = GigApplication.query.filter(
                GigApplication.ensemble_id.in_(ensemble_ids),
                GigApplication.status == 'accepted'
            ).join(Gig).order_by(Gig.date_time.desc()).all()
            
            for app in applications:
                gig = app.gig
                gigs_data.append({
                    'id': gig.id,
                    'application_id': app.id,
                    'title': gig.title,
                    'date_time': gig.date_time.isoformat(),
                    'venue_name': gig.venue.name,
                    'venue_location': gig.venue.location,
                    'ensemble_name': app.ensemble.name,
                    'status': gig.status,
                    'can_mark_completed': gig.date_time < datetime.utcnow() and app.gig_happened_ensemble is None,
                    'gig_happened_ensemble': app.gig_happened_ensemble,
                    'gig_happened_venue': app.gig_happened_venue,
                    'verified': app.confirmed_at is not None and app.gig_happened_venue and app.gig_happened_ensemble
                })
    
    elif user.role == 'venue':
        # Get venue for this user
        venue = Venue.query.filter_by(user_id=user.id).first()
        if venue:
            gigs = Gig.query.filter_by(venue_id=venue.id).order_by(Gig.date_time.desc()).all()
            for gig in gigs:
                gigs_data.append(gig.to_dict())
    
    return jsonify({
        'gigs': gigs_data,
        'role': user.role
    }), 200


@gigs_bp.route('/applications/<int:application_id>/mark-ensemble-completed', methods=['PUT'])
def mark_ensemble_completed(application_id):
    """
    Musician/Ensemble leader marks their side of the gig as completed
    Sets gig_happened_ensemble = True
    """
    application = GigApplication.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Verify gig date has passed
    if application.gig.date_time > datetime.utcnow():
        return jsonify({'error': 'Cannot mark as completed before gig date'}), 400
    
    # Mark ensemble's confirmation
    application.gig_happened_ensemble = True
    
    # If venue already confirmed, mark as fully verified
    if application.gig_happened_venue is not None:
        application.confirmed_at = datetime.utcnow()
        
        # If both confirmed YES, increment verified counts
        if application.gig_happened_venue and application.gig_happened_ensemble:
            venue = application.gig.venue
            venue.verified_gig_count += 1
            ensemble = application.ensemble
            ensemble.verified_gig_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Gig marked as completed',
        'application': application.to_dict()
    }), 200


@gigs_bp.route('/history/ensemble/<int:ensemble_id>', methods=['GET'])
def get_ensemble_gig_history(ensemble_id):
    """
    Get gig history for an ensemble
    Returns all applications and their status
    """
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble:
        return jsonify({'error': 'Ensemble not found'}), 404
    
    applications = GigApplication.query.filter_by(
        ensemble_id=ensemble_id
    ).join(Gig).order_by(Gig.date_time.desc()).all()
    
    history = []
    for app in applications:
        app_data = app.to_dict()
        app_data['gig_details'] = {
            'title': app.gig.title,
            'date_time': app.gig.date_time.isoformat(),
            'venue_name': app.gig.venue.name,
            'venue_location': app.gig.venue.location,
            'status': app.gig.status
        }
        history.append(app_data)
    
    return jsonify({
        'ensemble': {
            'id': ensemble.id,
            'name': ensemble.name,
            'verified_gig_count': ensemble.verified_gig_count
        },
        'applications': history,
        'stats': {
            'total': len(applications),
            'accepted': len([a for a in applications if a.status == 'accepted']),
            'pending': len([a for a in applications if a.status == 'pending']),
            'rejected': len([a for a in applications if a.status == 'rejected'])
        }
    }), 200