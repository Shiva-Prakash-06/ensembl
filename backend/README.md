# Ensembl Backend - Flask API

Python Flask backend for the Ensembl MVP.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. **Initialize/Reset Database:**
   *⚠️ Important:* If you have an existing `instance/ensembl.db` file from a previous version, **delete it first**. The new schema (invites, message types) requires a fresh database.

4. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── database.py           # Database initialization
├── requirements.txt      # Python dependencies
├── models/               # SQLAlchemy models
│   ├── user.py          # User/musician profiles
│   ├── jam_post.py      # Jam Board posts
│   ├── message.py       # Chat messages (Updated with Invite logic)
│   ├── ensemble.py      # Ensembles/bands & Invite tables
│   ├── venue.py         # Venue profiles
│   └── gig.py           # Gig postings and applications
└── blueprints/          # API route handlers
    ├── auth.py          # Authentication (Google/Email)
    ├── users.py         # User profile management
    ├── jam_board.py     # Jam Board feed
    ├── chat.py          # 1-to-1 messaging
    ├── ensembles.py     # Ensemble creation/management
    ├── venues.py        # Venue profiles
    └── gigs.py          # Gig postings and handshake flow
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/email` - Email login
- `POST /api/auth/signup` - Complete signup with onboarding
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/<id>` - Get user profile
- `PUT /api/users/<id>` - Update profile
- `GET /api/users/search` - Search users

### Jam Board
- `GET /api/jam-board/` - Get all jam posts (homepage feed)
- `POST /api/jam-board/` - Create new jam post
- `GET /api/jam-board/<id>` - Get single post
- `DELETE /api/jam-board/<id>` - Close post
- `POST /api/jam-board/<id>/raise-hand` - Toggle interest
- `GET /api/jam-board/<id>/interested` - View list of interested musicians

### Chat
- `GET /api/chat/conversations/<user_id>` - Get all conversations
- `GET /api/chat/messages/<user_id>/<other_id>` - Get messages between users
- `POST /api/chat/send` - Send message
- `PUT /api/chat/mark-read/conversation/<uid>/<other_id>` - Mark conversation as read
- `GET /api/chat/unread-count/<user_id>` - Get total unread count (for red badge)

### Ensembles
- `POST /api/ensembles/` - Create ensemble
- `GET /api/ensembles/<id>` - Get ensemble details
- `POST /api/ensembles/<id>/members` - Add member
- `GET /api/ensembles/user/<user_id>` - Get user's ensembles
- `POST /api/ensembles/<id>/invite` - Invite a user to join
- `POST /api/ensembles/<id>/accept` - Accept an invite
- `DELETE /api/ensembles/<id>/invites/<user_id>` - Decline an invite
- `DELETE /api/ensembles/<id>/members/<user_id>` - Remove member (or Leave ensemble)

### Venues
- `GET /api/venues/` - Get all venues
- `POST /api/venues/` - Create venue
- `GET /api/venues/<id>` - Get venue details
- `PUT /api/venues/<id>` - Update venue

### Gigs
- `GET /api/gigs/` - Get all gigs
- `POST /api/gigs/` - Create gig posting
- `GET /api/gigs/<id>` - Get gig details
- `POST /api/gigs/<id>/apply` - Apply to gig (ensemble)
- `GET /api/gigs/<id>/applications` - Get applications
- `PUT /api/gigs/applications/<id>/accept` - Accept application
- `PUT /api/gigs/applications/<id>/reject` - Reject application
- `PUT /api/gigs/applications/<id>/confirm` - Post-gig confirmation

## Database

SQLite database (`ensembl.db`) will be created automatically on first run.

## TODO - Future Enhancements
- [ ] Real Google OAuth integration
- [ ] JWT token authentication
- [ ] Password hashing for email auth
- [ ] WebSocket support for real-time chat
- [ ] File uploads for profile photos
- [ ] Advanced search and filtering
- [ ] Notifications system
