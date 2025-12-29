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
    
    content = db.Column(db.Text, nullable=False)
    
    # Types: 'text', 'invite'
    msg_type = db.Column(db.String(20), default='text')
    
    # If type='invite', this stores the ensemble_id
    related_id = db.Column(db.Integer, nullable=True)
    
    # NEW: Track the status of this specific invite message
    # Values: 'pending', 'accepted', 'declined', None (for text messages)
    invite_status = db.Column(db.String(20), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    is_read = db.Column(db.Boolean, default=False)
    
    sender = db.relationship('User', foreign_keys=[sender_id], back_populates='messages_sent')
    receiver = db.relationship('User', foreign_keys=[receiver_id], back_populates='messages_received')
    
    def to_dict(self):
        """Convert message to JSON-serializable dict"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'msg_type': self.msg_type,
            'related_id': self.related_id,
            'invite_status': self.invite_status, # <--- Sending this to frontend now
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }