"""
Admin Blueprint
Internal admin API for platform oversight

STRICT ETHICAL BOUNDARIES:
- NO access to private chat messages
- NO exposure of sensitive personal data (emails masked)
- NO hard-delete actions (only soft disable via is_active flag)
- NO user impersonation
- All actions are reversible
"""

from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.gig import Gig
from models.jam_post import JamPost
from decorators import admin_required
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def mask_email(email):
    """
    Mask email for privacy
    Example: shiva@gmail.com -> sh***@gmail.com
    """
    if not email or '@' not in email:
        return email
    
    username, domain = email.split('@', 1)
    if len(username) <= 2:
        masked_username = username[0] + '***'
    else:
        masked_username = username[:2] + '***'
    
    return f"{masked_username}@{domain}"


# ===== ANALYTICS ENDPOINTS =====

@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics(admin_user):
    """
    Get aggregate platform analytics
    Returns high-level metrics for business oversight
    """
    # User metrics
    total_users = User.query.filter(User.role != 'admin').count()
    active_users = User.query.filter(User.role != 'admin', User.is_active == True).count()
    musicians = User.query.filter_by(role='musician').count()
    venues_count = User.query.filter_by(role='venue').count()
    
    # Content metrics
    total_jam_posts = JamPost.query.count()
    active_ensembles = Ensemble.query.count()
    total_venues = Venue.query.count()
    total_gigs = Gig.query.count()
    open_gigs = Gig.query.filter_by(is_open=True).count()
    
    # Verified gigs (completed)
    from models.gig import GigApplication
    completed_gigs = GigApplication.query.filter(
        GigApplication.confirmed_at.isnot(None)
    ).count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'active': active_users,
            'musicians': musicians,
            'venues': venues_count
        },
        'content': {
            'jam_posts': total_jam_posts,
            'ensembles': active_ensembles,
            'venues': total_venues,
            'gigs': {
                'total': total_gigs,
                'open': open_gigs,
                'completed': completed_gigs
            }
        }
    }), 200


# ===== USER MANAGEMENT =====

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(admin_user):
    """
    Get all users with masked sensitive data
    Supports pagination and filtering
    """
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Filters
    role_filter = request.args.get('role')  # musician, venue
    status_filter = request.args.get('status')  # active, inactive
    
    # Build query
    query = User.query.filter(User.role != 'admin')  # Exclude admins from list
    
    if role_filter:
        query = query.filter_by(role=role_filter)
    
    if status_filter == 'active':
        query = query.filter_by(is_active=True)
    elif status_filter == 'inactive':
        query = query.filter_by(is_active=False)
    
    # Paginate
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users = []
    for user in pagination.items:
        users.append({
            'id': user.id,
            'name': user.name,
            'email': mask_email(user.email),  # MASKED for privacy
            'role': user.role,
            'city': user.city,
            'instrument': user.instrument if user.role == 'musician' else None,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat()
        })
    
    return jsonify({
        'users': users,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_detail(admin_user, user_id):
    """
    Get detailed user info (non-sensitive)
    """
    user = User.query.get(user_id)
    
    if not user or user.role == 'admin':
        return jsonify({'error': 'User not found'}), 404
    
    # Count user's ensembles
    ensemble_count = Ensemble.query.filter(
        (Ensemble.leader_id == user_id) | 
        (Ensemble.members.any(id=user_id))
    ).count()
    
    # Count jam posts if musician
    jam_post_count = JamPost.query.filter_by(author_id=user_id).count() if user.role == 'musician' else 0
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': mask_email(user.email),
        'role': user.role,
        'city': user.city,
        'instrument': user.instrument if user.role == 'musician' else None,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat(),
        'stats': {
            'ensembles': ensemble_count,
            'jam_posts': jam_post_count
        }
    }), 200


@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(admin_user, user_id):
    """
    Soft disable/enable a user
    This is REVERSIBLE - user can be re-enabled
    """
    user = User.query.get(user_id)
    
    if not user or user.role == 'admin':
        return jsonify({'error': 'User not found'}), 404
    
    # Toggle active status
    user.is_active = not user.is_active
    db.session.commit()
    
    return jsonify({
        'message': f"User {'enabled' if user.is_active else 'disabled'}",
        'user_id': user.id,
        'is_active': user.is_active
    }), 200


# ===== VENUE MANAGEMENT =====

@admin_bp.route('/venues', methods=['GET'])
@admin_required
def get_venues(admin_user):
    """
    Get all venues with stats
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Venue.query.order_by(Venue.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    venues = []
    for venue in pagination.items:
        # Count gigs for this venue
        gig_count = Gig.query.filter_by(venue_id=venue.id).count()
        
        venues.append({
            'id': venue.id,
            'name': venue.name,
            'location': venue.location,
            'verified_gig_count': venue.verified_gig_count or 0,
            'total_gigs': gig_count,
            'created_at': venue.created_at.isoformat()
        })
    
    return jsonify({
        'venues': venues,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


# ===== ENSEMBLE MANAGEMENT =====

@admin_bp.route('/ensembles', methods=['GET'])
@admin_required
def get_ensembles(admin_user):
    """
    Get all ensembles with member counts
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Ensemble.query.order_by(Ensemble.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    ensembles = []
    for ensemble in pagination.items:
        ensembles.append({
            'id': ensemble.id,
            'name': ensemble.name,
            'leader_name': ensemble.leader.name if ensemble.leader else 'Unknown',
            'member_count': len(ensemble.members) if ensemble.members else 0,
            'verified_gig_count': ensemble.verified_gig_count or 0,
            'created_at': ensemble.created_at.isoformat()
        })
    
    return jsonify({
        'ensembles': ensembles,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


# ===== GIG MANAGEMENT =====

@admin_bp.route('/gigs', methods=['GET'])
@admin_required
def get_gigs(admin_user):
    """
    Get all gigs with application stats
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')  # open, closed
    
    query = Gig.query
    
    if status_filter == 'open':
        query = query.filter_by(is_open=True)
    elif status_filter == 'closed':
        query = query.filter_by(is_open=False)
    
    pagination = query.order_by(Gig.date_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    gigs = []
    for gig in pagination.items:
        from models.gig import GigApplication
        application_count = GigApplication.query.filter_by(gig_id=gig.id).count()
        
        gigs.append({
            'id': gig.id,
            'title': gig.title,
            'venue_name': gig.venue.name if gig.venue else 'Unknown',
            'date_time': gig.date_time.isoformat(),
            'is_open': gig.is_open,
            'applications': application_count,
            'created_at': gig.created_at.isoformat()
        })
    
    return jsonify({
        'gigs': gigs,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@admin_bp.route('/gigs/<int:gig_id>/toggle-open', methods=['POST'])
@admin_required
def toggle_gig_open(admin_user, gig_id):
    """
    Soft disable/enable a gig
    Admin can close problematic gigs (reversible)
    """
    gig = Gig.query.get(gig_id)
    
    if not gig:
        return jsonify({'error': 'Gig not found'}), 404
    
    # Toggle open status
    gig.is_open = not gig.is_open
    db.session.commit()
    
    return jsonify({
        'message': f"Gig {'opened' if gig.is_open else 'closed'}",
        'gig_id': gig.id,
        'is_open': gig.is_open
    }), 200

