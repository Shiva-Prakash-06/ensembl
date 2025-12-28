"""
Jam Post Model
Represents "Looking For" posts on the Jam Board
"""

from database import db
from datetime import datetime


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
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_active = db.Column(db.Boolean, default=True)  # Can be closed by author
    
    # Relationships
    author = db.relationship('User', back_populates='jam_posts')
    
    def to_dict(self):
        """Convert jam post to JSON-serializable dict"""
        return {
            'id': self.id,
            'author': {
                'id': self.author.id,
                'name': self.author.name,
                'instrument': self.author.instrument,
                'photo_url': self.author.photo_url
            },
            'looking_for_instrument': self.looking_for_instrument,
            'genre': self.genre,
            'location': self.location,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<JamPost: Looking for {self.looking_for_instrument}>'
