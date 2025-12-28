"""
Venue Model
Represents performance venues looking for acts
"""

from database import db
from datetime import datetime


class Venue(db.Model):
    """
    Venue profile - places that post gigs
    """
    __tablename__ = 'venues'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)  # Links to User with role='venue'
    name = db.Column(db.String(100), nullable=False)
    
    # Venue details
    location = db.Column(db.String(200), nullable=False)  # Full address
    vibe_tags = db.Column(db.String(200), nullable=True)  # Comma-separated tags
    tech_specs = db.Column(db.Text, nullable=True)  # PA system, instruments available, etc.
    description = db.Column(db.Text, nullable=True)
    verified_gig_count = db.Column(db.Integer, default=0)  # Incremented after both parties confirm gig happened
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='venue_profile')
    gigs = db.relationship('Gig', back_populates='venue', lazy='dynamic')
    
    def to_dict(self):
        """Convert venue to JSON-serializable dict"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'location': self.location,
            'vibe_tags': self.vibe_tags.split(',') if self.vibe_tags else [],
            'tech_specs': self.tech_specs,
            'description': self.description,
            'verified_gig_count': self.verified_gig_count,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Venue {self.name}>'
