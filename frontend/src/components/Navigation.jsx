/**
 * Navigation Component
 * 
 * Phase 3: Enhanced with visual state indicators
 * Shows badges for:
 * - Unread messages
 * - Pending ensemble invites
 * - Gig application updates
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Navigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // State for indicators
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasPendingInvites, setHasPendingInvites] = useState(false)
  const [hasGigUpdates, setHasGigUpdates] = useState(false)

  // Fetch indicator states whenever the user navigates
  useEffect(() => {
    if (user) {
      fetchIndicators()
    }
  }, [user, location.pathname])

  const fetchIndicators = async () => {
    try {
      // 1. Unread message count
      const unreadData = await api.getUnreadCount(user.id)
      setUnreadCount(unreadData.unread_count)

      // 2. Check for pending ensemble invites (musician only)
      if (user.role === 'musician') {
        const conversations = await api.getConversations(user.id)
        let hasPending = false
        
        for (const conv of conversations.conversations || []) {
          const messages = await api.getMessages(user.id, conv.other_user.id)
          const pendingInvites = messages.messages?.filter(
            msg => msg.msg_type === 'invite' && 
                   msg.invite_status === 'pending' &&
                   msg.receiver_id === user.id
          ) || []
          
          if (pendingInvites.length > 0) {
            hasPending = true
            break
          }
        }
        
        setHasPendingInvites(hasPending)
      }
    } catch (error) {
      console.error("Failed to fetch indicators", error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Notification Badge Component (count-based)
  const NotificationBadge = ({ count }) => {
    if (!count || count === 0) return null
    return (
      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  // Indicator Dot Component (presence-based)
  const IndicatorDot = ({ show }) => {
    if (!show) return null
    return (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></span>
    )
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
                <Link to="/" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                  Jam Board
                </Link>
                <Link to="/gigs" className="text-gray-700 hover:text-indigo-600 transition font-medium relative">
                  Gigs
                  <IndicatorDot show={hasGigUpdates} />
                </Link>
                <Link to="/ensembles" className="text-gray-700 hover:text-indigo-600 transition font-medium relative">
                  Ensembles
                  <IndicatorDot show={hasPendingInvites} />
                </Link>
                <Link to="/analytics/musician" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                  Analytics
                  {user?.is_pro && <span className="ml-1 text-xs">✨</span>}
                </Link>
                <Link to="/chat" className="text-gray-700 hover:text-indigo-600 transition font-medium relative">
                  Chat
                  <NotificationBadge count={unreadCount} />
                </Link>
              </>
            )}
            {user?.role === 'venue' && (
              <>
                <Link to="/venue-dashboard" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                  My Gigs
                </Link>
                <Link to="/analytics/venue" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                  Analytics
                  {user?.is_pro && <span className="ml-1 text-xs">✨</span>}
                </Link>
                <Link to="/chat" className="text-gray-700 hover:text-indigo-600 transition font-medium relative">
                  Messages
                  <NotificationBadge count={unreadCount} />
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