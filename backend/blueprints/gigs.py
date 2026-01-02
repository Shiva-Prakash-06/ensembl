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
from models.message import Message
from datetime import datetime
from sqlalchemy import or_, and_

gigs_bp = Blueprint('gigs', __name__)


# ===== GIG POSTINGS =====

@gigs_bp.route('/', methods=['GET'])
def get_gigs():
    """
    Get gigs for the board.
    - Public: Shows all open gigs.
    - Musician: Shows open gigs AND any closed gigs where they have an ACTIVE notification.
    - EXCLUDES: Open gigs where the musician was rejected and dismissed the alert.
    """
    location = request.args.get('location')
    filter_open = request.args.get('is_open', 'true').lower() == 'true'
    
    user_id = request.headers.get('X-User-Id')
    
    # 1. Identify User and their Applications
    my_app_status = {} # gig_id -> status
    gigs_with_notifications = [] 
    hidden_gig_ids = [] # IDs to explicitly hide (Rejected + Dismissed)
    
    if user_id:
        user = User.query.get(user_id)
        if user and user.role == 'musician':
            # Find ensembles where user is leader OR member
            my_ensembles = Ensemble.query.filter(
                (Ensemble.leader_id == user.id) | 
                (Ensemble.members.any(id=user.id))
            ).all()
            
            ensemble_ids = [e.id for e in my_ensembles]
            
            if ensemble_ids:
                # Find all applications for these ensembles
                my_apps = GigApplication.query.filter(
                    GigApplication.ensemble_id.in_(ensemble_ids)
                ).all()
                
                for app in my_apps:
                    if not app.musician_acknowledged:
                        # Active Notification: Show status and force gig to appear
                        my_app_status[app.gig_id] = app.status
                        if app.status in ['accepted', 'rejected']:
                            gigs_with_notifications.append(app.gig_id)
                    else:
                        # Acknowledged (Dismissed)
                        # If I was REJECTED and I dismissed it, I never want to see this open gig again.
                        if app.status == 'rejected':
                            hidden_gig_ids.append(app.gig_id)

    # 2. Build Query
    query = Gig.query
    
    if filter_open:
        # Show: (All Open Gigs) OR (Specific Closed Gigs with Notifications)
        if gigs_with_notifications:
            query = query.filter(or_(Gig.is_open == True, Gig.id.in_(gigs_with_notifications)))
        else:
            query = query.filter_by(is_open=True)
            
        # FILTER OUT HIDDEN GIGS (Rejected + Dismissed)
        if hidden_gig_ids:
            query = query.filter(Gig.id.notin_(hidden_gig_ids))
            
    else:
        query = query.filter_by(is_open=False)
    
    if location:
        query = query.join(Venue).filter(Venue.location.ilike(f'%{location}%'))
    
    gigs = query.order_by(Gig.date_time.asc()).all()
    
    # 3. Serialize
    results = []
    for gig in gigs:
        gig_dict = gig.to_dict()
        gig_dict['my_status'] = my_app_status.get(gig.id) 
        results.append(gig_dict)
    
    return jsonify({
        'gigs': results
    }), 200


@gigs_bp.route('/', methods=['POST'])
def create_gig():
    """Create a new gig posting (by venue)"""
    data = request.json
    
    required = ['venue_id', 'title', 'date_time', 'description']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    venue = Venue.query.get(data['venue_id'])
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
    
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
    """Ensemble applies to a gig"""
    gig = Gig.query.get(gig_id)
    if not gig: return jsonify({'error': 'Gig not found'}), 404
    if not gig.is_open: return jsonify({'error': 'Gig is not accepting applications'}), 400
    
    data = request.json
    ensemble_id = data.get('ensemble_id')
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    
    existing = GigApplication.query.filter_by(gig_id=gig_id, ensemble_id=ensemble_id).first()
    if existing: return jsonify({'error': 'Already applied to this gig'}), 409
    
    application = GigApplication(gig_id=gig_id, ensemble_id=ensemble_id, status='pending')
    db.session.add(application)
    db.session.commit()
    
    return jsonify({'message': 'Application submitted', 'application': application.to_dict()}), 201


@gigs_bp.route('/<int:gig_id>/applications', methods=['GET'])
def get_gig_applications(gig_id):
    """Get all applications for a gig"""
    gig = Gig.query.get(gig_id)
    if not gig: return jsonify({'error': 'Gig not found'}), 404
    applications = gig.applications.all()
    return jsonify({'applications': [app.to_dict() for app in applications]}), 200


@gigs_bp.route('/<int:gig_id>/dismiss', methods=['PUT'])
def dismiss_gig_notification(gig_id):
    """Musician dismisses notification"""
    user_id = request.headers.get('X-User-Id')
    if not user_id: return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get(user_id)
    if not user or user.role != 'musician':
        return jsonify({'error': 'Only musicians can dismiss notifications'}), 403

    my_ensembles = Ensemble.query.filter(
        (Ensemble.leader_id == user.id) | 
        (Ensemble.members.any(id=user.id))
    ).all()
    ensemble_ids = [e.id for e in my_ensembles]

    application = GigApplication.query.filter(
        GigApplication.gig_id == gig_id,
        GigApplication.ensemble_id.in_(ensemble_ids)
    ).first()

    if not application:
        return jsonify({'error': 'Application not found'}), 404

    application.musician_acknowledged = True
    db.session.commit()

    return jsonify({'message': 'Notification dismissed'}), 200


# ===== GIG HANDSHAKE =====

@gigs_bp.route('/applications/<int:application_id>/accept', methods=['PUT'])
def accept_application(application_id):
    """Venue accepts an application"""
    application = GigApplication.query.get(application_id)
    if not application: return jsonify({'error': 'Application not found'}), 404
    
    application.status = 'accepted'
    gig = application.gig
    gig.is_open = False
    gig.status = 'accepted'

    venue_owner_id = gig.venue.user_id
    ensemble_leader_id = application.ensemble.leader_id
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
        'chat_with_id': ensemble_leader_id
    }), 200


@gigs_bp.route('/applications/<int:application_id>/reject', methods=['PUT'])
def reject_application(application_id):
    """Venue rejects an application"""
    application = GigApplication.query.get(application_id)
    if not application: return jsonify({'error': 'Application not found'}), 404
    application.status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Application rejected'}), 200


@gigs_bp.route('/<int:gig_id>/mark-completed', methods=['PUT'])
def mark_gig_completed(gig_id):
    """Venue marks gig as completed"""
    gig = Gig.query.get(gig_id)
    if not gig: return jsonify({'error': 'Gig not found'}), 404
    if gig.date_time > datetime.utcnow(): return jsonify({'error': 'Cannot mark as completed before gig date'}), 400
    if gig.status != 'accepted': return jsonify({'error': 'Can only mark accepted gigs as completed'}), 400
    
    gig.status = 'completed'
    gig.completed_at = datetime.utcnow()
    
    accepted_app = GigApplication.query.filter_by(gig_id=gig_id, status='accepted').first()
    if accepted_app:
        accepted_app.gig_happened_venue = True
        if accepted_app.gig_happened_ensemble is not None:
            accepted_app.confirmed_at = datetime.utcnow()
            if accepted_app.gig_happened_venue and accepted_app.gig_happened_ensemble:
                gig.venue.verified_gig_count += 1
                accepted_app.ensemble.verified_gig_count += 1
    
    db.session.commit()
    return jsonify({'message': 'Gig marked as completed', 'gig': gig.to_dict()}), 200


@gigs_bp.route('/applications/<int:application_id>/confirm', methods=['PUT'])
def confirm_gig_happened(application_id):
    """Post-gig confirmation"""
    application = GigApplication.query.get(application_id)
    if not application: return jsonify({'error': 'Application not found'}), 404
    
    data = request.json
    confirmer_role = data.get('confirmer_role')
    gig_happened = data.get('gig_happened', False)
    
    if confirmer_role == 'venue':
        application.gig_happened_venue = gig_happened
    elif confirmer_role == 'ensemble':
        application.gig_happened_ensemble = gig_happened
    else:
        return jsonify({'error': 'Invalid confirmer_role'}), 400
    
    if application.gig_happened_venue is not None and application.gig_happened_ensemble is not None:
        application.confirmed_at = datetime.utcnow()
        if application.gig_happened_venue and application.gig_happened_ensemble:
            application.gig.venue.verified_gig_count += 1
            application.ensemble.verified_gig_count += 1
    
    db.session.commit()
    return jsonify({'message': 'Confirmation recorded', 'application': application.to_dict()}), 200


# ===== GIG HISTORY & MY GIGS =====

@gigs_bp.route('/history/venue/<int:venue_id>', methods=['GET'])
def get_venue_gig_history(venue_id):
    """
    Get gig history for a venue
    STRICT FILTER: ONLY show gigs where status = 'completed'.
    """
    venue = Venue.query.get(venue_id)
    if not venue: return jsonify({'error': 'Venue not found'}), 404
    
    # STRICT: DB Query filters for 'completed' only. No 'open' or 'accepted' gigs allowed.
    gigs = Gig.query.filter_by(venue_id=venue_id, status='completed').order_by(Gig.date_time.desc()).all()
    
    history = []
    for gig in gigs:
        accepted_app = GigApplication.query.filter_by(gig_id=gig.id, status='accepted').first()
        
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
        'venue': {'id': venue.id, 'name': venue.name, 'verified_gig_count': venue.verified_gig_count},
        'gigs': history,
        'stats': {
            'total': len(history),
            'verified_count': len(history)
        }
    }), 200


@gigs_bp.route('/my-gigs', methods=['GET'])
def get_my_gigs():
    """
    Get ACTIVE gigs for current user.
    STRICT FILTER: Exclude Fully Verified/Completed gigs.
    """
    user_id = request.headers.get('X-User-Id')
    if not user_id: return jsonify({'error': 'Authentication required'}), 401
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    gigs_data = []
    
    if user.role == 'musician':
        musician_ensembles = Ensemble.query.filter(
            (Ensemble.leader_id == user.id) | (Ensemble.members.any(id=user.id))
        ).all()
        ensemble_ids = [e.id for e in musician_ensembles]
        
        if ensemble_ids:
            # Get accepted gigs
            applications = GigApplication.query.filter(
                GigApplication.ensemble_id.in_(ensemble_ids),
                GigApplication.status == 'accepted'
            ).join(Gig).order_by(Gig.date_time.desc()).all()
            
            for app in applications:
                # STRICT: If gig is completed or verified, SKIP (it goes to history)
                if app.gig.status == 'completed' or app.confirmed_at:
                    continue
                    
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
                    'verified': False 
                })
    
    elif user.role == 'venue':
        venue = Venue.query.filter_by(user_id=user.id).first()
        if venue:
            # STRICT: Only show gigs that are NOT completed
            gigs = Gig.query.filter(
                Gig.venue_id == venue.id,
                Gig.status != 'completed'
            ).order_by(Gig.date_time.desc()).all()
            
            for gig in gigs:
                gigs_data.append(gig.to_dict())
    
    return jsonify({'gigs': gigs_data, 'role': user.role}), 200


@gigs_bp.route('/applications/<int:application_id>/mark-ensemble-completed', methods=['PUT'])
def mark_ensemble_completed(application_id):
    application = GigApplication.query.get(application_id)
    if not application: return jsonify({'error': 'Application not found'}), 404
    if application.gig.date_time > datetime.utcnow(): return jsonify({'error': 'Cannot mark as completed before gig date'}), 400
    
    application.gig_happened_ensemble = True
    if application.gig_happened_venue is not None:
        application.confirmed_at = datetime.utcnow()
        if application.gig_happened_venue and application.gig_happened_ensemble:
            application.gig.venue.verified_gig_count += 1
            application.ensemble.verified_gig_count += 1
    
    db.session.commit()
    return jsonify({'message': 'Gig marked as completed', 'application': application.to_dict()}), 200


@gigs_bp.route('/history/ensemble/<int:ensemble_id>', methods=['GET'])
def get_ensemble_gig_history(ensemble_id):
    """
    Get gig history for an ensemble
    STRICT FILTER: Only show Fully Verified or Rejected applications
    """
    ensemble = Ensemble.query.get(ensemble_id)
    if not ensemble: return jsonify({'error': 'Ensemble not found'}), 404
    
    applications = GigApplication.query.filter_by(ensemble_id=ensemble_id).join(Gig).order_by(Gig.date_time.desc()).all()
    history = []
    
    for app in applications:
        # STRICT CHECK:
        # 1. Rejected apps go to history
        # 2. Accepted apps go to history ONLY if gig is 'completed' or confirmed_at is set
        is_history = False
        
        if app.status == 'rejected':
            is_history = True
        elif app.status == 'accepted':
            if app.gig.status == 'completed' or app.confirmed_at:
                is_history = True
        
        if is_history:
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
        'ensemble': {'id': ensemble.id, 'name': ensemble.name, 'verified_gig_count': ensemble.verified_gig_count},
        'applications': history,
        'stats': {
            'total': len(history),
            'verified': len([a for a in history if a['status'] == 'accepted']),
            'rejected': len([a for a in history if a['status'] == 'rejected'])
        }
    }), 200