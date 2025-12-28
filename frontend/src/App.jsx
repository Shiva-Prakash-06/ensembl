/**
 * Ensembl MVP - Main App Component
 * Handles routing and global state
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import JamBoard from './pages/JamBoard'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Ensembles from './pages/Ensembles'
import Gigs from './pages/Gigs'
import VenueProfile from './pages/VenueProfile'
import VenueDashboard from './pages/VenueDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Jam Board is the homepage for musicians */}
              <Route path="/" element={<JamBoard />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:userId" element={<Chat />} />
              <Route path="/ensembles" element={<Ensembles />} />
              <Route path="/gigs" element={<Gigs />} />
              <Route path="/venues/:venueId" element={<VenueProfile />} />
              <Route path="/venue-dashboard" element={<VenueDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
