/**
 * Activity Feed Component
 * * Phase 3: Awareness, Feedback & Emotional UX
 * Displays recent activity derived from existing data
 * * Activity types:
 * - Unread messages
 * - Ensemble invites (pending/accepted/declined)
 * - Gig applications (accepted/rejected)
 * - Gig confirmations
 * * No backend changes - uses existing API data
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ActivityFeed({ maxItems = 10 }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // SAFETY GUARD: Only load if user ID exists
    if (user?.id) {
      loadActivities()
    }
  }, [user?.id])

  const loadActivities = async () => {
    if (!user?.id) return; 

    try {
      const activityItems = []

      // 1. Check for unread messages
      try {
        const unreadData = await api.getUnreadCount(user.id)
        if (unreadData.unread_count > 0) {
          activityItems.push({
            id: `unread-${Date.now()}`,
            type: 'message',
            icon: '💬',
            title: 'New messages',
            description: `You have ${unreadData.unread_count} unread message${unreadData.unread_count !== 1 ? 's' : ''}`,
            timestamp: new Date(),
            color: 'indigo',
            link: '/chat'
          })
        }
      } catch (error) {
        console.error('Failed to load unread count:', error)
      }

      // 2. Check for ensemble invites (from messages with type 'invite')
      try {
        const conversations = await api.getConversations(user.id)
        const inviteMessages = []
        
        for (const conv of conversations.conversations || []) {
          // Safety check
          if (!conv.other_user?.id) continue;

          const messages = await api.getMessages(user.id, conv.other_user.id)
          const pendingInvites = messages.messages?.filter(
            msg => msg.msg_type === 'invite' && 
                   msg.invite_status === 'pending' &&
                   msg.receiver_id === user.id
          ) || []
          inviteMessages.push(...pendingInvites)
        }

        inviteMessages.forEach(invite => {
          activityItems.push({
            id: `invite-${invite.id}`,
            type: 'invite',
            icon: '🎭',
            title: 'Ensemble invitation',
            description: invite.content || 'You have a pending ensemble invite',
            timestamp: new Date(invite.created_at),
            color: 'purple',
            link: '/chat'
          })
        })
      } catch (error) {
        console.error('Failed to load invites:', error)
      }

      // 3. Check for gig application updates (if user is in ensembles)
      if (user.role === 'musician') {
        try {
          const ensemblesData = await api.getUserEnsembles(user.id)
          for (const ensemble of ensemblesData.ensembles || []) {
            // Note: We don't have a direct "get my applications" endpoint yet
            // This is a placeholder for future activity
          }
        } catch (error) {
          console.error('Failed to load ensemble applications:', error)
        }
      }

      // Sort by timestamp (most recent first)
      activityItems.sort((a, b) => b.timestamp - a.timestamp)

      setActivities(activityItems.slice(0, maxItems))
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return timestamp.toLocaleDateString()
  }

  const getColorClasses = (color) => {
    const colors = {
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700'
    }
    return colors[color] || colors.indigo
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>Recent Activity</span>
        {activities.length > 0 && (
          <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {activities.length}
          </span>
        )}
      </h3>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-gray-500 text-sm">All quiet on the jam front</p>
          <p className="text-gray-400 text-xs mt-1">Your activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <a
              key={activity.id}
              href={activity.link}
              className={`block p-3 rounded-lg border transition-all hover:shadow-md ${getColorClasses(activity.color)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}