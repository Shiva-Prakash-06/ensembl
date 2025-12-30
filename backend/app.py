"""
Ensembl MVP - Main Flask Application
Entry point for the Flask backend server
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from database import db, init_db
from blueprints.auth import auth_bp
from blueprints.users import users_bp
from blueprints.jam_board import jam_board_bp
from blueprints.chat import chat_bp
from blueprints.ensembles import ensembles_bp
from blueprints.venues import venues_bp
from blueprints.gigs import gigs_bp
from blueprints.admin import admin_bp


def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS for frontend communication
    CORS(app)
    
    # Initialize database
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(jam_board_bp, url_prefix='/api/jam-board')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(ensembles_bp, url_prefix='/api/ensembles')
    app.register_blueprint(venues_bp, url_prefix='/api/venues')
    app.register_blueprint(gigs_bp, url_prefix='/api/gigs')
    app.register_blueprint(admin_bp)  # Admin blueprint has its own prefix
    
    # Create tables on first run
    with app.app_context():
        init_db()
    
    @app.route('/api/health')
    def health_check():
        """Simple health check endpoint"""
        return {'status': 'ok', 'service': 'Ensembl API'}
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
