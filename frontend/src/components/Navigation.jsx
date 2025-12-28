/**
 * Navigation Component
 * Top navigation bar with links
 */

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Ensembl
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {user?.role === 'musician' && (
              <>
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Jam Board
                </Link>
                <Link 
                  to="/gigs" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Gigs
                </Link>
                <Link 
                  to="/ensembles" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  My Ensembles
                </Link>
                <Link 
                  to="/chat" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Chat
                </Link>
              </>
            )}
            {user?.role === 'venue' && (
              <>
                <Link 
                  to="/venue-dashboard" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  My Gigs
                </Link>
                <Link 
                  to="/chat" 
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Messages
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link 
              to={`/profile/${user?.id}`}
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              {user?.name}
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
