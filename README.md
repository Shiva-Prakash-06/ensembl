# Ensembl MVP

A UI-first platform for musicians to connect, collaborate, form lightweight ensembles, and apply for local gigs.

## Project Structure

```
ensembl/
├── backend/              # Flask REST API
│   ├── app.py           # Main Flask application
│   ├── config.py        # Configuration
│   ├── database.py      # Database initialization
│   ├── requirements.txt # Python dependencies
│   ├── models/          # SQLAlchemy models
│   └── blueprints/      # API routes
│
└── frontend/            # React + Vite app
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── context/     # React contexts
    │   └── services/    # API client
    └── package.json
```

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- React Router
- Fetch API for backend communication

**Backend:**
- Python Flask (REST-style)
- SQLAlchemy ORM
- SQLite database
- Flask-CORS for cross-origin requests

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Core Features (MVP Only)

### 1. Authentication & Onboarding
- Google / Email login (mock)
- Fast signup: instrument + city only

### 2. Musician Profile
- Name, photo placeholder, media embed link
- 3-5 vibe tags, short bio
- Availability toggle (Open to Jam / Not Active)

### 3. Jam Board (Homepage)
- Feed of "Looking For" posts
- Create jam posts (instrument needed, genre, location)
- Message / raise hand button

### 4. Chat
- 1-to-1 text messaging
- Triggered from Jam Board interactions

### 5. Ensembles
- Create ensemble from existing connections
- Add/remove members
- Auto-generated combined profile
- Verified gig counter

### 6. Venue & Gig Board
- Venue profiles (name, location, vibe, tech specs)
- Gig posts (date/time, payment text, description)
- One-click ensemble application

### 7. Gig Handshake
- Venue accepts application → chat opens
- Post-gig confirmation: "Did this gig happen?"
- Increments verified gig count

## Design Philosophy

- **Jam Board is the homepage** - Connection-first experience
- **Fast onboarding** - Only essential info required
- **Clean, minimal UI** - Tailwind-based, simple components
- **Connection first** - Focus on human interaction

## Out of Scope (MVP)

❌ Payments integration  
❌ Rating/review systems  
❌ AI matching algorithms  
❌ Push notifications  
❌ File uploads (photos/audio)  
❌ Advanced search filters  

## API Documentation

See [backend/README.md](backend/README.md) for detailed API endpoints.

## Development Notes

- Database is SQLite (`ensembl.db`) - auto-created on first run
- Authentication is mocked for MVP - implement real OAuth later
- All routes are REST-style (no GraphQL)
- Frontend uses Context API for state management

## Future Enhancements

See TODO comments in code for specific improvement areas:
- Real Google OAuth integration
- JWT token authentication
- WebSocket support for real-time chat
- File upload functionality
- Advanced filtering and search
- Notifications system
- Mobile app considerations

## License

Private MVP - All rights reserved

---

Built with ❤️ for musicians by musicians
