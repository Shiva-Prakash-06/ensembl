"""
Message Model
1-to-1 text chat between musicians
"""

from database import db
from datetime import datetime


class Message(db.Model):
    """
    Simple 1-to-1 chat messages
    Triggered from Jam Board interactions
    """
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Message content
    content = db.Column(db.Text, nullable=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_read = db.Column(db.Boolean, default=False)
    
    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], back_populates='messages_sent')
    receiver = db.relationship('User', foreign_keys=[receiver_id], back_populates='messages_received')
    
    def to_dict(self):
        """Convert message to JSON-serializable dict"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }
    
    def __repr__(self):
        return f'<Message from User {self.sender_id} to User {self.receiver_id}>'
