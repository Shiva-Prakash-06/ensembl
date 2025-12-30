"""
Admin Decorators
Middleware for protecting admin-only routes

ETHICAL RULES:
- Admin must NOT view private chat messages
- Admin must NOT see sensitive personal data (only masked)
- Admin must NOT impersonate users
- All admin actions must be reversible (soft disable)
"""

from functools import wraps
from flask import request, jsonify
from models.user import User


def admin_required(f):
    """
    Decorator to protect admin-only routes
    Checks if user has admin role
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get user_id from request (could be from headers, session, JWT, etc.)
        # For MVP, we'll use a simple header-based approach
        user_id = request.headers.get('X-User-Id')
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Check if user exists and has admin role
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Pass admin user to the route
        return f(admin_user=user, *args, **kwargs)
    
    return decorated_function
