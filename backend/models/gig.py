"""
Gig Model
Gig postings and applications
"""

from database import db
from datetime import datetime


class Gig(db.Model):
    """
    Gig posting from a venue
    """
    __tablename__ = 'gigs'
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    
    # Gig details
    title = db.Column(db.String(200), nullable=False)
    date_time = db.Column(db.DateTime, nullable=False)  # When the gig is happening
    payment_description = db.Column(db.String(200), nullable=True)  # Text only, no actual payment
    description = db.Column(db.Text, nullable=False)
    
    # Status
    is_open = db.Column(db.Boolean, default=True)  # Whether still accepting applications
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    venue = db.relationship('Venue', back_populates='gigs')
    applications = db.relationship('GigApplication', back_populates='gig', lazy='dynamic')
    
    def to_dict(self):
        """Convert gig to JSON-serializable dict"""
        return {
            'id': self.id,
            'venue': {
                'id': self.venue.id,
                'name': self.venue.name,
                'location': self.venue.location
            },
            'title': self.title,
            'date_time': self.date_time.isoformat(),
            'payment_description': self.payment_description,
            'description': self.description,
            'is_open': self.is_open,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Gig {self.title} at {self.venue.name}>'


class GigApplication(db.Model):
    """
    Ensemble application to a gig
    Gig Handshake: venue accepts, chat opens, post-gig confirmation
    """
    __tablename__ = 'gig_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    gig_id = db.Column(db.Integer, db.ForeignKey('gigs.id'), nullable=False)
    ensemble_id = db.Column(db.Integer, db.ForeignKey('ensembles.id'), nullable=False)
    
    # Application status
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    
    # Post-gig confirmation - both parties must confirm
    gig_happened_venue = db.Column(db.Boolean, nullable=True)  # Venue's confirmation
    gig_happened_ensemble = db.Column(db.Boolean, nullable=True)  # Ensemble leader's confirmation
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # Metadata
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    gig = db.relationship('Gig', back_populates='applications')
    ensemble = db.relationship('Ensemble', back_populates='gig_applications')
    
    def to_dict(self):
        """Convert application to JSON-serializable dict"""
        return {
            'id': self.id,
            'gig_id': self.gig_id,
            'ensemble': self.ensemble.to_dict(),
            'status': self.status,
            'gig_happened_venue': self.gig_happened_venue,
            'gig_happened_ensemble': self.gig_happened_ensemble,
            'applied_at': self.applied_at.isoformat()
        }
    
    def __repr__(self):
        return f'<GigApplication {self.ensemble.name} -> Gig {self.gig_id}>'
