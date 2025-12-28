"""
Gigs Blueprint
Gig postings, applications, and the Gig Handshake flow
"""

from flask import Blueprint, request, jsonify
from database import db
from models.gig import Gig, GigApplication
from models.venue import Venue
from models.ensemble import Ensemble
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
    This triggers the Gig Handshake flow
    TODO: Open chat between venue and ensemble leader
    """
    application = GigApplication.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    application.status = 'accepted'
    
    # Close the gig to other applications
    gig = application.gig
    gig.is_open = False
    
    db.session.commit()
    
    return jsonify({
        'message': 'Application accepted! Chat opened.',
        'application': application.to_dict()
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
