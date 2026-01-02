"""
History Blueprint
Phase 2 Fix: Verified Gig History - Source of Truth

Provides actual gig history data to replace hardcoded verified_gig_count
Shows completed gigs with metadata for musicians and venues

STRICT SCOPE: No payments, ratings, or notifications
"""

from flask import Blueprint, jsonify
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.gig import Gig, GigApplication
from decorators import login_required
from datetime import datetime

history_bp = Blueprint('history', __name__, url_prefix='/api/history')


@history_bp.route('/musician', methods=['GET'])
@login_required
def get_musician_history(current_user):
    """
    Get gig history for a musician
    
    Role Check: Must be a musician
    Returns: List of completed gigs across all ensembles
    
    Response Structure:
    {
        "history": [
            {
                "id": 1,
                "gig_title": "Friday Night Jazz",
                "venue_name": "Blue Note",
                "venue_location": "New York, NY",
                "date": "2025-12-15T20:00:00",
                "ensemble_name": "Sarah Martinez Quartet",
                "status": "completed",
                "verified": true
            }
        ],
        "verified_count": 5
    }
    """
    # Role validation
    if current_user.role != 'musician':
        return jsonify({
            'error': 'Only musicians can access musician history',
            'history': [],
            'verified_count': 0
        }), 403
    
    try:
        # Get all ensembles this musician is part of
        musician_ensembles = Ensemble.query.filter(
            (Ensemble.leader_id == current_user.id) | 
            (Ensemble.members.any(id=current_user.id))
        ).all()
        
        ensemble_ids = [e.id for e in musician_ensembles]
        
        if not ensemble_ids:
            # No ensembles = no gig history
            return jsonify({
                'history': [],
                'verified_count': 0
            }), 200
        
        # Get all applications for these ensembles
        applications = GigApplication.query.filter(
            GigApplication.ensemble_id.in_(ensemble_ids)
        ).join(Gig).order_by(Gig.date_time.desc()).all()
        
        history = []
        verified_count = 0
        
        for app in applications:
            gig = app.gig
            
            # Only include accepted or completed gigs
            if app.status != 'accepted':
                continue
            
            # Check if verified (both parties confirmed)
            is_verified = (
                app.confirmed_at is not None and
                app.gig_happened_venue == True and
                app.gig_happened_ensemble == True
            )
            
            if is_verified:
                verified_count += 1
            
            history.append({
                'id': app.id,
                'gig_id': gig.id,
                'gig_title': gig.title,
                'venue_name': gig.venue.name,
                'venue_location': gig.venue.location,
                'date': gig.date_time.isoformat(),
                'ensemble_name': app.ensemble.name,
                'status': gig.status,  # open, accepted, completed
                'verified': is_verified
            })
        
        return jsonify({
            'history': history,
            'verified_count': verified_count
        }), 200
        
    except Exception as e:
        # Graceful error handling - always return valid structure
        print(f"Error in musician history: {e}")
        return jsonify({
            'history': [],
            'verified_count': 0,
            'error': 'Failed to load history'
        }), 500


@history_bp.route('/venue', methods=['GET'])
@login_required
def get_venue_history(current_user):
    """
    Get gig history for a venue
    
    Role Check: Must be a venue
    Returns: List of all gigs posted by this venue
    
    Response Structure:
    {
        "history": [
            {
                "id": 1,
                "gig_title": "Friday Night Jazz",
                "date": "2025-12-15T20:00:00",
                "ensemble_name": "Sarah Martinez Quartet",
                "status": "completed",
                "verified": true
            }
        ],
        "verified_count": 10
    }
    """
    # Role validation
    if current_user.role != 'venue':
        return jsonify({
            'error': 'Only venues can access venue history',
            'history': [],
            'verified_count': 0
        }), 403
    
    try:
        # Get venue profile for this user
        venue = Venue.query.filter_by(user_id=current_user.id).first()
        
        if not venue:
            # No venue profile = no gig history
            return jsonify({
                'history': [],
                'verified_count': 0
            }), 200
        
        # Get all gigs for this venue
        gigs = Gig.query.filter_by(venue_id=venue.id).order_by(Gig.date_time.desc()).all()
        
        history = []
        verified_count = 0
        
        for gig in gigs:
            # Find the accepted application (if any)
            accepted_app = GigApplication.query.filter_by(
                gig_id=gig.id,
                status='accepted'
            ).first()
            
            ensemble_name = None
            is_verified = False
            
            if accepted_app:
                ensemble_name = accepted_app.ensemble.name
                
                # Check if verified (both parties confirmed)
                is_verified = (
                    accepted_app.confirmed_at is not None and
                    accepted_app.gig_happened_venue == True and
                    accepted_app.gig_happened_ensemble == True
                )
                
                if is_verified:
                    verified_count += 1
            
            # Include all gigs (open, accepted, completed)
            history.append({
                'id': gig.id,
                'gig_title': gig.title,
                'date': gig.date_time.isoformat(),
                'ensemble_name': ensemble_name,
                'status': gig.status,  # open, accepted, completed
                'verified': is_verified
            })
        
        return jsonify({
            'history': history,
            'verified_count': verified_count
        }), 200
        
    except Exception as e:
        # Graceful error handling - always return valid structure
        print(f"Error in venue history: {e}")
        return jsonify({
            'history': [],
            'verified_count': 0,
            'error': 'Failed to load history'
        }), 500
