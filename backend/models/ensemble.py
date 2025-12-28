"""
Ensemble Model
Project container for groups of musicians
"""

from database import db
from datetime import datetime


# Association table for many-to-many relationship
ensemble_members = db.Table('ensemble_members',
    db.Column('ensemble_id', db.Integer, db.ForeignKey('ensembles.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('joined_at', db.DateTime, default=datetime.utcnow)
)


class Ensemble(db.Model):
    """
    Ensemble/Band - formed from existing chats
    Auto-generated combined profile for gig applications
    """
    __tablename__ = 'ensembles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Who created it
    
    # Auto-generated profile (combined from members)
    combined_bio = db.Column(db.Text, nullable=True)
    combined_media = db.Column(db.Text, nullable=True)  # JSON list of member media links
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_gig_count = db.Column(db.Integer, default=0)  # Incremented after gig confirmation
    
    # Relationships
    leader = db.relationship('User', foreign_keys=[leader_id])
    members = db.relationship('User', secondary=ensemble_members, 
                            backref=db.backref('ensembles', lazy='dynamic'))
    gig_applications = db.relationship('GigApplication', back_populates='ensemble', lazy='dynamic')
    
    def to_dict(self):
        """Convert ensemble to JSON-serializable dict"""
        return {
            'id': self.id,
            'name': self.name,
            'leader_id': self.leader_id,
            'members': [
                {
                    'id': member.id,
                    'name': member.name,
                    'instrument': member.instrument,
                    'photo_url': member.photo_url
                }
                for member in self.members
            ],
            'combined_bio': self.combined_bio,
            'verified_gig_count': self.verified_gig_count,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Ensemble {self.name}>'
