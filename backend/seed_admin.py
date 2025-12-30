"""
Admin Seed Script
Creates an admin user for platform oversight

Usage:
    python seed_admin.py

Environment Variables (optional):
    ADMIN_EMAIL - Admin email (default: admin@ensembl.com)
    ADMIN_NAME - Admin name (default: Admin)
"""

import os
import sys
from app import create_app
from database import db
from models.user import User


def create_admin_user():
    """
    Create an admin user if one doesn't exist
    """
    app = create_app()
    
    with app.app_context():
        # Get admin credentials from environment or use defaults
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@ensembl.com')
        admin_name = os.getenv('ADMIN_NAME', 'Admin')
        
        # Check if admin already exists
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"❌ Admin user already exists: {admin_email}")
            print(f"   User ID: {existing_admin.id}")
            print(f"   Role: {existing_admin.role}")
            
            if existing_admin.role != 'admin':
                print(f"   ⚠️  WARNING: This user is not an admin! Updating role...")
                existing_admin.role = 'admin'
                db.session.commit()
                print(f"   ✅ Role updated to admin")
            
            return existing_admin
        
        # Create new admin user
        admin = User(
            email=admin_email,
            name=admin_name,
            role='admin',  # ADMIN ROLE
            city='Platform',  # Required field
            is_active=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {admin_email}")
        print(f"   Name: {admin_name}")
        print(f"   User ID: {admin.id}")
        print(f"   Role: {admin.role}")
        print(f"\n📝 Use this User ID in the X-User-Id header for admin API calls")
        
        return admin


if __name__ == '__main__':
    try:
        admin = create_admin_user()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

