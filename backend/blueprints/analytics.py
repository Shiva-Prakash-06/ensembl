"""
Analytics Blueprint
Phase 5: Pro-gated analytics for musicians and venues

NO AI/ML - Just SQL aggregations and simple metrics
Pro users get full analytics, Free users see limited preview
"""

from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.gig import Gig, GigApplication
from decorators import login_required
from sqlalchemy import func
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


def check_pro_access(user):
    """
    Check if user has Pro access
    Returns (is_pro, error_response)
    """
    if not user.is_pro:
        # Return limited preview data with Pro teaser
        return False, None
    return True, None


# ===== MUSICIAN ANALYTICS =====

@analytics_bp.route('/musician', methods=['GET'])
@login_required
def get_musician_analytics(current_user):
    """
    Musician analytics dashboard
    Pro: Full analytics
    Free: Limited preview with Pro teaser
    """
    if current_user.role != 'musician':
        return jsonify({'error': 'Only musicians can access musician analytics'}), 403
    
    is_pro = current_user.is_pro
    
    # Get all ensembles this musician is part of
    musician_ensembles = Ensemble.query.filter(
        (Ensemble.leader_id == current_user.id) | 
        (Ensemble.members.any(id=current_user.id))
    ).all()
    
    ensemble_ids = [e.id for e in musician_ensembles]
    
    # Total gigs played (accepted applications)
    total_gigs = GigApplication.query.filter(
        GigApplication.ensemble_id.in_(ensemble_ids),
        GigApplication.status == 'accepted'
    ).count() if ensemble_ids else 0
    
    # Completed gigs (with confirmation)
    completed_gigs = GigApplication.query.filter(
        GigApplication.ensemble_id.in_(ensemble_ids),
        GigApplication.confirmed_at.isnot(None),
        GigApplication.gig_happened_venue == True,
        GigApplication.gig_happened_ensemble == True
    ).count() if ensemble_ids else 0
    
    # Total applications submitted
    total_applications = GigApplication.query.filter(
        GigApplication.ensemble_id.in_(ensemble_ids)
    ).count() if ensemble_ids else 0
    
    # Acceptance rate
    acceptance_rate = (total_gigs / total_applications * 100) if total_applications > 0 else 0
    
    # Free users: Limited data
    if not is_pro:
        return jsonify({
            'is_pro': False,
            'preview': {
                'total_gigs': total_gigs,
                'completed_gigs': completed_gigs,
                'acceptance_rate': round(acceptance_rate, 1)
            },
            'pro_teaser': {
                'message': 'Upgrade to Pro to unlock detailed analytics',
                'features': [
                    'Genre breakdown of your gigs',
                    'Collaboration network analysis',
                    'Performance trends over time',
                    'Venue relationship insights'
                ]
            }
        }), 200
    
    # Pro users: Full analytics
    
    # Genre breakdown (from gig titles/descriptions - simplified)
    genre_data = {}
    for ensemble in musician_ensembles:
        applications = GigApplication.query.filter_by(
            ensemble_id=ensemble.id,
            status='accepted'
        ).all()
        
        for app in applications:
            # Simple genre detection from gig title
            title_lower = app.gig.title.lower()
            if 'jazz' in title_lower:
                genre_data['Jazz'] = genre_data.get('Jazz', 0) + 1
            elif 'rock' in title_lower:
                genre_data['Rock'] = genre_data.get('Rock', 0) + 1
            elif 'blues' in title_lower:
                genre_data['Blues'] = genre_data.get('Blues', 0) + 1
            elif 'classical' in title_lower:
                genre_data['Classical'] = genre_data.get('Classical', 0) + 1
            else:
                genre_data['Other'] = genre_data.get('Other', 0) + 1
    
    # Collaborators (other musicians in ensembles)
    collaborators = set()
    for ensemble in musician_ensembles:
        for member in ensemble.members:
            if member.id != current_user.id:
                collaborators.add(member.name)
    
    # Gigs over time (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_gigs = GigApplication.query.join(Gig).filter(
        GigApplication.ensemble_id.in_(ensemble_ids),
        GigApplication.status == 'accepted',
        Gig.date_time >= six_months_ago
    ).order_by(Gig.date_time).all() if ensemble_ids else []
    
    # Group by month
    gigs_by_month = {}
    for app in recent_gigs:
        month_key = app.gig.date_time.strftime('%Y-%m')
        gigs_by_month[month_key] = gigs_by_month.get(month_key, 0) + 1
    
    # Top venues played at
    venue_counts = {}
    for app in GigApplication.query.filter(
        GigApplication.ensemble_id.in_(ensemble_ids),
        GigApplication.status == 'accepted'
    ).all() if ensemble_ids else []:
        venue_name = app.gig.venue.name
        venue_counts[venue_name] = venue_counts.get(venue_name, 0) + 1
    
    top_venues = sorted(venue_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return jsonify({
        'is_pro': True,
        'overview': {
            'total_gigs': total_gigs,
            'completed_gigs': completed_gigs,
            'total_applications': total_applications,
            'acceptance_rate': round(acceptance_rate, 1)
        },
        'genres': [{'name': k, 'count': v} for k, v in genre_data.items()],
        'collaborators': {
            'count': len(collaborators),
            'names': list(collaborators)[:10]  # Top 10
        },
        'timeline': [{'month': k, 'gigs': v} for k, v in sorted(gigs_by_month.items())],
        'top_venues': [{'name': name, 'gigs': count} for name, count in top_venues]
    }), 200


# ===== VENUE ANALYTICS =====

@analytics_bp.route('/venue', methods=['GET'])
@login_required
def get_venue_analytics(current_user):
    """
    Venue analytics dashboard
    Pro: Full analytics
    Free: Limited preview with Pro teaser
    """
    if current_user.role != 'venue':
        return jsonify({'error': 'Only venues can access venue analytics'}), 403
    
    is_pro = current_user.is_pro
    
    # Get venue associated with this user
    venue = Venue.query.filter_by(user_id=current_user.id).first()
    if not venue:
        return jsonify({'error': 'No venue associated with this user'}), 404
    
    # Total gigs posted
    total_gigs = Gig.query.filter_by(venue_id=venue.id).count()
    
    # Completed gigs
    completed_gigs = Gig.query.filter_by(
        venue_id=venue.id,
        status='completed'
    ).count()
    
    # Verified gigs (both parties confirmed)
    verified_gigs = GigApplication.query.join(Gig).filter(
        Gig.venue_id == venue.id,
        GigApplication.confirmed_at.isnot(None),
        GigApplication.gig_happened_venue == True,
        GigApplication.gig_happened_ensemble == True
    ).count()
    
    # Completion rate
    completion_rate = (completed_gigs / total_gigs * 100) if total_gigs > 0 else 0
    
    # Free users: Limited data
    if not is_pro:
        return jsonify({
            'is_pro': False,
            'preview': {
                'total_gigs': total_gigs,
                'completed_gigs': completed_gigs,
                'verified_gigs': verified_gigs,
                'completion_rate': round(completion_rate, 1)
            },
            'pro_teaser': {
                'message': 'Upgrade to Pro to unlock detailed analytics',
                'features': [
                    'Popular genres at your venue',
                    'Ensemble performance ratings',
                    'Booking trends over time',
                    'Application response metrics'
                ]
            }
        }), 200
    
    # Pro users: Full analytics
    
    # Genre breakdown (from gig titles)
    genre_data = {}
    for gig in Gig.query.filter_by(venue_id=venue.id).all():
        title_lower = gig.title.lower()
        if 'jazz' in title_lower:
            genre_data['Jazz'] = genre_data.get('Jazz', 0) + 1
        elif 'rock' in title_lower:
            genre_data['Rock'] = genre_data.get('Rock', 0) + 1
        elif 'blues' in title_lower:
            genre_data['Blues'] = genre_data.get('Blues', 0) + 1
        elif 'classical' in title_lower:
            genre_data['Classical'] = genre_data.get('Classical', 0) + 1
        else:
            genre_data['Other'] = genre_data.get('Other', 0) + 1
    
    # Applications per gig (average)
    total_applications = GigApplication.query.join(Gig).filter(
        Gig.venue_id == venue.id
    ).count()
    avg_applications = (total_applications / total_gigs) if total_gigs > 0 else 0
    
    # Gigs over time (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_gigs = Gig.query.filter(
        Gig.venue_id == venue.id,
        Gig.date_time >= six_months_ago
    ).order_by(Gig.date_time).all()
    
    gigs_by_month = {}
    for gig in recent_gigs:
        month_key = gig.date_time.strftime('%Y-%m')
        gigs_by_month[month_key] = gigs_by_month.get(month_key, 0) + 1
    
    # Top ensembles (most gigs played)
    ensemble_counts = {}
    for app in GigApplication.query.join(Gig).filter(
        Gig.venue_id == venue.id,
        GigApplication.status == 'accepted'
    ).all():
        ensemble_name = app.ensemble.name
        ensemble_counts[ensemble_name] = ensemble_counts.get(ensemble_name, 0) + 1
    
    top_ensembles = sorted(ensemble_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return jsonify({
        'is_pro': True,
        'overview': {
            'total_gigs': total_gigs,
            'completed_gigs': completed_gigs,
            'verified_gigs': verified_gigs,
            'completion_rate': round(completion_rate, 1),
            'avg_applications_per_gig': round(avg_applications, 1)
        },
        'genres': [{'name': k, 'count': v} for k, v in genre_data.items()],
        'timeline': [{'month': k, 'gigs': v} for k, v in sorted(gigs_by_month.items())],
        'top_ensembles': [{'name': name, 'gigs': count} for name, count in top_ensembles]
    }), 200
