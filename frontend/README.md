# Ensembl Frontend - React + Vite

React frontend for the Ensembl MVP, built with Vite and Tailwind CSS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── index.html              # HTML entry point
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
├── postcss.config.js      # PostCSS config
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app component with routing
    ├── index.css          # Global styles
    ├── components/        # Reusable components
    │   ├── Layout.jsx
    │   ├── Navigation.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── JamPostCard.jsx
    │   ├── CreateJamPostModal.jsx
    |   |── EnsembleInviteModal.jsx  # NEW: Invite musicians to bands
    │   └── AlertModal.jsx           # NEW: Custom alerts & confirmations
    ├── pages/             # Page components
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── JamBoard.jsx
    │   ├── Profile.jsx
    │   ├── Chat.jsx
    │   ├── Ensembles.jsx
    │   ├── Gigs.jsx
    │   └── VenueProfile.jsx
    ├── context/           # React contexts
    │   └── AuthContext.jsx
    └── services/          # API services
        └── api.js
```

## Features

### Authentication
- Mock Google OAuth login
- Email login (placeholder)
- Fast onboarding (instrument + city only)

### Jam Board (Homepage)
- Feed of "Looking For" posts
- Create new jam posts
- Message musicians directly
- View all musicians who raised their hands
- One-click interest toggle

### Profile
- View and edit musician profiles
- Media embed links
- Vibe tags
- Availability toggle

### Chat
- 1-to-1 text messaging
- Conversations list
- Real-time-ready structure
- Accept or Decline band invites directly in chat
- Notifications when members join, leave, or are removed
- Red notification count on the navbar

### Ensembles
- Create and manage ensembles
- Add/remove members
- View verified gig count
- Search and invite musicians from the Jam Board

### Gigs
- Browse gig postings
- One-click applications with ensemble
- Venue details

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## TODO - Future Enhancements
- [ ] Real Google OAuth integration
- [ ] WebSocket for real-time chat
- [ ] Image upload for profile photos
- [ ] Advanced search and filtering
- [ ] Push notifications
- [ ] Mobile responsive improvements
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
