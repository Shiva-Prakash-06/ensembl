"""
Jam Post Model
Represents "Looking For" posts on the Jam Board
"""

from database import db
from datetime import datetime

# 1. Association table to track "Hand Raises"
jam_interests = db.Table('jam_interests',
    db.Column('jam_post_id', db.Integer, db.ForeignKey('jam_posts.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('timestamp', db.DateTime, default=datetime.now)
)

class JamPost(db.Model):
    """
    Posts on the Jam Board (homepage)
    Musicians looking for other musicians to jam with
    """
    __tablename__ = 'jam_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Post content
    looking_for_instrument = db.Column(db.String(50), nullable=False)  # e.g., "Drummer"
    genre = db.Column(db.String(50), nullable=True)  # e.g., "Jazz", "Rock"
    location = db.Column(db.String(100), nullable=False)  # City/area
    description = db.Column(db.Text, nullable=False)  # Details about the jam
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    is_active = db.Column(db.Boolean, default=True)  # Can be closed by author
    
    # Relationships
    author = db.relationship('User', back_populates='jam_posts')
    
    # 2. Relationship to access interested users
    interested_musicians = db.relationship(
        'User',
        secondary=jam_interests,
        backref=db.backref('interested_jams', lazy='dynamic'),
        lazy='dynamic'
    )
    
    def to_dict(self, current_user_id=None):
        """Convert jam post to JSON-serializable dict"""
        
        # Check if the viewer has raised their hand
        has_raised_hand = False
        if current_user_id:
            # Check if current_user_id is in the interested_musicians list
            has_raised_hand = self.interested_musicians.filter_by(id=current_user_id).first() is not None

        return {
            'id': self.id,
            'author': {
                'id': self.author.id,
                'name': self.author.name if self.author else "Unknown",
                # FIX IS HERE: Use self.author.instrument directly
                'instrument': self.author.instrument if self.author else "Musician",
                # 'photo_url': self.author.photo_url # handled by frontend placeholder for now
            },
            'looking_for_instrument': self.looking_for_instrument,
            'genre': self.genre,
            'location': self.location,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            
            # New fields for the UI
            'has_raised_hand': has_raised_hand,
            'interest_count': self.interested_musicians.count()
        }
    
    def __repr__(self):
        return f'<JamPost: Looking for {self.looking_for_instrument}>'