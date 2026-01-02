"""
User Model
Represents musicians on the platform
"""

from database import db
from datetime import datetime

class User(db.Model):
    """
    Core user/musician profile
    Minimal fields for MVP onboarding
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    
    # User role: "musician" or "venue"
    role = db.Column(db.String(20), nullable=False, default='musician')
    
    # OAuth fields
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    
    # Onboarding fields (only instrument + city required)
    instrument = db.Column(db.String(50), nullable=True)  # Only for musicians
    city = db.Column(db.String(100), nullable=False)  # Required for all users
    
    # Profile fields
    photo_url = db.Column(db.String(500), nullable=True)  # Placeholder for now
    media_embed = db.Column(db.String(500), nullable=True)  # YouTube/SoundCloud link
    bio = db.Column(db.Text, nullable=True)
    vibe_tags = db.Column(db.String(200), nullable=True)  # Comma-separated, 3-5 tags
    
    # Availability toggle
    is_active = db.Column(db.Boolean, default=True)  # "Open to Jam" vs "Not Active"
    
    # Phase 5: Pro Subscription (Admin-controlled only, no payments)
    is_pro = db.Column(db.Boolean, default=False)  # Pro analytics access
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jam_posts = db.relationship('JamPost', back_populates='author', lazy='dynamic')
    messages_sent = db.relationship('Message', foreign_keys='Message.sender_id', 
                                   back_populates='sender', lazy='dynamic')
    messages_received = db.relationship('Message', foreign_keys='Message.receiver_id',
                                       back_populates='receiver', lazy='dynamic')
    
    def to_dict(self):
        """Convert user to JSON-serializable dict"""
        base_dict = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'city': self.city,
            'is_pro': self.is_pro,  # Phase 5: Include Pro status
            'created_at': self.created_at.isoformat()
        }
        
        # FIX: Ensure keys ALWAYS exist (set to None by default)
        # This prevents 'undefined' errors on the frontend
        base_dict['musician_profile'] = None
        base_dict['venue_profile'] = None
        
        if self.role == 'musician':
            # Synthesize musician_profile from the user object itself
            base_dict['musician_profile'] = {
                'id': self.id, # Profile ID is same as User ID
                'instrument': self.instrument,
                'photo_url': self.photo_url,
                'media_embed': self.media_embed,
                'bio': self.bio,
                'vibe_tags': self.vibe_tags.split(',') if self.vibe_tags else [],
                'is_active': self.is_active,
            }
            # Flattened fields also available at root
            base_dict.update(base_dict['musician_profile'])

        elif self.role == 'venue':
            # Dynamically import Venue to avoid circular import
            from models.venue import Venue
            venue = Venue.query.filter_by(user_id=self.id).first()
            
            if venue:
                base_dict['venue_profile'] = {
                    'id': venue.id,
                    'name': venue.name,
                    'location': venue.location,
                    'verified_gig_count': venue.verified_gig_count
                }
        
        return base_dict
    
    def __repr__(self):
        return f'<User {self.name} ({self.role})>'