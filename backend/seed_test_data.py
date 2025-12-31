"""
Seed Test Data Script
Creates test musicians, venues, gigs, and admin user for development
"""

from app import create_app
from database import db
from models.user import User
from models.venue import Venue
from models.ensemble import Ensemble
from models.gig import Gig, GigApplication
from datetime import datetime, timedelta
import sys

def seed_test_data():
    """Seed database with comprehensive test data"""
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()
        
        # ===== ADMIN USER (ID 1) =====
        print("\n1. Creating admin user...")
        admin = User(
            email='admin@ensembl.com',
            name='Admin User',
            role='admin',
            google_id='admin_google_123',
            city='Los Angeles, CA',  # Required field
            is_active=True,
            is_pro=False  # Admin doesn't need Pro
        )
        db.session.add(admin)
        db.session.flush()  # Get the ID
        print(f"   ✓ Admin created with ID: {admin.id}")
        
        # ===== 2 TEST MUSICIANS =====
        print("\n2. Creating 2 test musicians...")
        
        # Musician 1: Pro User
        musician1 = User(
            email='sarah.jazz@example.com',
            name='Sarah Martinez',
            role='musician',
            google_id='musician1_google_456',
            instrument='Saxophone',
            city='Los Angeles, CA',
            bio='Professional jazz saxophonist with 10+ years experience. Love bebop and fusion.',
            vibe_tags='Jazz,Bebop,Smooth Jazz,Fusion',
            photo_url='https://i.pravatar.cc/150?img=1',
            is_active=True,
            is_pro=True  # PRO USER
        )
        db.session.add(musician1)
        
        # Musician 2: Free User
        musician2 = User(
            email='mike.drums@example.com',
            name='Mike Thompson',
            role='musician',
            google_id='musician2_google_789',
            instrument='Drums',
            city='Los Angeles, CA',
            bio='Drummer looking for jazz and blues gigs. Available weekends.',
            vibe_tags='Jazz,Blues,Rock,Funk',
            photo_url='https://i.pravatar.cc/150?img=2',
            is_active=True,
            is_pro=False  # FREE USER
        )
        db.session.add(musician2)
        
        db.session.flush()
        print(f"   ✓ Musician 1 (Pro): {musician1.name} - {musician1.instrument}")
        print(f"   ✓ Musician 2 (Free): {musician2.name} - {musician2.instrument}")
        
        # ===== 3 TEST VENUES =====
        print("\n3. Creating 3 test venues...")
        
        # Venue User 1: Pro
        venue_user1 = User(
            email='bluenotejazz@example.com',
            name='Blue Note Jazz Club',
            role='venue',
            google_id='venue1_google_101',
            city='Los Angeles, CA',
            is_active=True,
            is_pro=True  # PRO VENUE
        )
        db.session.add(venue_user1)
        db.session.flush()
        
        venue1 = Venue(
            user_id=venue_user1.id,
            name='Blue Note Jazz Club',
            location='123 Jazz Street, Los Angeles, CA 90028',
            vibe_tags='Jazz,Intimate,Upscale',
            tech_specs='Full PA system, backline available, Steinway grand piano',
            description='Premier jazz venue in LA. Intimate setting with world-class acoustics.',
            verified_gig_count=15
        )
        db.session.add(venue1)
        
        # Venue User 2: Pro
        venue_user2 = User(
            email='redlion@example.com',
            name='The Red Lion Pub',
            role='venue',
            google_id='venue2_google_102',
            city='Los Angeles, CA',
            is_active=True,
            is_pro=True  # PRO VENUE
        )
        db.session.add(venue_user2)
        db.session.flush()
        
        venue2 = Venue(
            user_id=venue_user2.id,
            name='The Red Lion Pub',
            location='456 Main Street, Los Angeles, CA 90012',
            vibe_tags='Blues,Rock,Casual',
            tech_specs='House PA, drum kit available, guitar amps',
            description='Neighborhood pub with live music every weekend. Blues and rock friendly.',
            verified_gig_count=8
        )
        db.session.add(venue2)
        
        # Venue User 3: Free
        venue_user3 = User(
            email='sunsetcafe@example.com',
            name='Sunset Cafe',
            role='venue',
            google_id='venue3_google_103',
            city='Los Angeles, CA',
            is_active=True,
            is_pro=False  # FREE VENUE
        )
        db.session.add(venue_user3)
        db.session.flush()
        
        venue3 = Venue(
            user_id=venue_user3.id,
            name='Sunset Cafe',
            location='789 Ocean Ave, Los Angeles, CA 90291',
            vibe_tags='Acoustic,Chill,Coffee Shop',
            tech_specs='Small PA, acoustic-friendly',
            description='Cozy cafe looking for acoustic acts. Great for singer-songwriters.',
            verified_gig_count=3
        )
        db.session.add(venue3)
        
        db.session.flush()
        print(f"   ✓ Venue 1 (Pro): {venue1.name}")
        print(f"   ✓ Venue 2 (Pro): {venue2.name}")
        print(f"   ✓ Venue 3 (Free): {venue3.name}")
        
        # ===== CREATE AN ENSEMBLE =====
        print("\n4. Creating test ensemble...")
        ensemble = Ensemble(
            name='Sarah Martinez Quartet',
            leader_id=musician1.id,
            combined_bio='Contemporary jazz quartet specializing in bebop and fusion.',
            verified_gig_count=5
        )
        db.session.add(ensemble)
        ensemble.members.append(musician1)
        ensemble.members.append(musician2)
        db.session.flush()
        print(f"   ✓ Ensemble: {ensemble.name} (Leader: {musician1.name}, Members: 2)")
        
        # ===== 3 GIGS WITH DIFFERENT STATUSES =====
        print("\n5. Creating 3 gigs with different statuses...")
        
        # Gig 1: COMPLETED (past date, marked as completed)
        gig1 = Gig(
            venue_id=venue1.id,
            title='Friday Night Jazz Session',
            date_time=datetime.utcnow() - timedelta(days=7),  # 1 week ago
            description='Weekly jazz night featuring contemporary and classic jazz standards.',
            payment_description='$500 for the band',
            is_open=False,
            status='completed',  # COMPLETED STATUS
            completed_at=datetime.utcnow() - timedelta(days=6)  # Marked completed day after gig
        )
        db.session.add(gig1)
        db.session.flush()
        
        # Create accepted application for gig1
        app1 = GigApplication(
            gig_id=gig1.id,
            ensemble_id=ensemble.id,
            status='accepted',
            gig_happened_venue=True,
            gig_happened_ensemble=True,
            confirmed_at=datetime.utcnow() - timedelta(days=5)
        )
        db.session.add(app1)
        print(f"   ✓ Gig 1 (COMPLETED): {gig1.title} at {venue1.name}")
        
        # Gig 2: ACCEPTED (past date, NOT marked as completed yet - venue can mark it)
        gig2 = Gig(
            venue_id=venue2.id,
            title='Blues Night at The Red Lion',
            date_time=datetime.utcnow() - timedelta(days=2),  # 2 days ago
            description='High-energy blues night. Bring your A-game!',
            payment_description='$400 plus tips',
            is_open=False,
            status='accepted',  # ACCEPTED but not completed
            completed_at=None  # Not marked as completed yet
        )
        db.session.add(gig2)
        db.session.flush()
        
        # Create accepted application for gig2
        app2 = GigApplication(
            gig_id=gig2.id,
            ensemble_id=ensemble.id,
            status='accepted'
        )
        db.session.add(app2)
        print(f"   ✓ Gig 2 (ACCEPTED, can mark completed): {gig2.title} at {venue2.name}")
        
        # Gig 3: OPEN (future date, accepting applications)
        gig3 = Gig(
            venue_id=venue3.id,
            title='Sunday Acoustic Brunch',
            date_time=datetime.utcnow() + timedelta(days=14),  # 2 weeks from now
            description='Relaxed acoustic music for Sunday brunch. Jazz, folk, or light pop.',
            payment_description='$200 fixed rate',
            is_open=True,
            status='open',  # OPEN STATUS
            completed_at=None
        )
        db.session.add(gig3)
        db.session.flush()
        
        # Create pending application for gig3
        app3 = GigApplication(
            gig_id=gig3.id,
            ensemble_id=ensemble.id,
            status='pending'
        )
        db.session.add(app3)
        print(f"   ✓ Gig 3 (OPEN): {gig3.title} at {venue3.name}")
        
        # ===== COMMIT ALL =====
        db.session.commit()
        
        print("\n" + "="*60)
        print("✅ SEED COMPLETE!")
        print("="*60)
        print("\nTest Accounts Created:")
        print(f"\n👤 ADMIN:")
        print(f"   Email: admin@ensembl.com")
        print(f"   ID: {admin.id}")
        print(f"\n🎵 MUSICIANS:")
        print(f"   1. {musician1.name} ({musician1.instrument}) - ✨ PRO")
        print(f"      Email: {musician1.email}")
        print(f"   2. {musician2.name} ({musician2.instrument}) - FREE")
        print(f"      Email: {musician2.email}")
        print(f"\n🏛️  VENUES:")
        print(f"   1. {venue1.name} - ✨ PRO")
        print(f"      Email: {venue_user1.email}")
        print(f"   2. {venue2.name} - ✨ PRO")
        print(f"      Email: {venue_user2.email}")
        print(f"   3. {venue3.name} - FREE")
        print(f"      Email: {venue_user3.email}")
        print(f"\n🎤 ENSEMBLE:")
        print(f"   {ensemble.name} (2 members)")
        print(f"\n🎸 GIGS:")
        print(f"   1. {gig1.title} - ✅ COMPLETED")
        print(f"   2. {gig2.title} - 🟢 ACCEPTED (can mark completed)")
        print(f"   3. {gig3.title} - 🔵 OPEN (accepting applications)")
        print("\n" + "="*60)
        print("\nTo login, use Google OAuth with these emails")
        print("or update auth.py to allow direct email login for testing.")
        print("="*60 + "\n")

if __name__ == '__main__':
    try:
        seed_test_data()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
