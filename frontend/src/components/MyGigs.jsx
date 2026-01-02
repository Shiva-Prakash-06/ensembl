/**
 * My Gigs Component
 * Shows accepted gigs for musicians with ability to mark as completed
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useFeedbackBanner } from './FeedbackBanner'

export default function MyGigs() {
  const { user } = useAuth()
  const { banner, showBanner } = useFeedbackBanner()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadGigs = async () => {
    try {
      setLoading(true)
      const data = await api.getMyGigs()
      setGigs(data.gigs || [])
    } catch (error) {
      console.error('Failed to load gigs:', error)
      showBanner('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadGigs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleMarkCompleted = async (applicationId) => {
    try {
      await api.markEnsembleCompleted(applicationId)
      showBanner('success', 'Gig marked as completed!')
      loadGigs()
    } catch (error) {
      console.error('Failed to mark gig as completed:', error)
      showBanner('error', error.message)
    }
  }

  const getStatusBadge = (gig) => {
    if (gig.verified) {
      return 'bg-purple-100 text-purple-700'
    }
    if (gig.gig_happened_ensemble !== null && gig.gig_happened_venue !== null) {
      return 'bg-blue-100 text-blue-700'
    }
    if (gig.status === 'completed') {
      return 'bg-blue-100 text-blue-700'
    }
    return 'bg-green-100 text-green-700'
  }

  const getStatusText = (gig) => {
    if (gig.verified) return 'Verified'
    if (gig.gig_happened_ensemble !== null && gig.gig_happened_venue !== null) return 'Confirmed'
    if (gig.status === 'completed') return 'Venue Confirmed'
    return 'Booked'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Gigs</h2>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {banner}
      <h2 className="text-xl font-bold text-gray-900 mb-6">My Gigs</h2>

      {gigs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎸</div>
          <p className="text-gray-500">No booked gigs yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Apply to gigs to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => {
            const isPast = new Date(gig.date_time) < new Date()
            const canMarkCompleted = gig.can_mark_completed
            const waitingForVenue = isPast && gig.gig_happened_ensemble === true && gig.gig_happened_venue === null
            const waitingForMe = isPast && gig.gig_happened_venue === true && gig.gig_happened_ensemble === null

            return (
              <div
                key={gig.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {gig.venue_name}, {gig.venue_location}
                    </p>
                    <p className="text-sm text-gray-600">
                      🎭 {gig.ensemble_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 {new Date(gig.date_time).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(gig)}`}>
                      {getStatusText(gig)}
                    </span>
                    
                    {canMarkCompleted && (
                      <button
                        onClick={() => handleMarkCompleted(gig.application_id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmation Status */}
                {isPast && !gig.verified && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Confirmation:</span>
                      <span className={`${gig.gig_happened_venue ? 'text-green-600' : 'text-gray-400'}`}>
                        {gig.gig_happened_venue ? '✓' : '○'} Venue
                      </span>
                      <span className={`${gig.gig_happened_ensemble ? 'text-green-600' : 'text-gray-400'}`}>
                        {gig.gig_happened_ensemble ? '✓' : '○'} You
                      </span>
                    </div>
                    {waitingForVenue && (
                      <p className="text-xs text-blue-600 mt-1">Waiting for venue to confirm</p>
                    )}
                    {waitingForMe && (
                      <p className="text-xs text-orange-600 mt-1">Waiting for you to confirm</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {gigs.length > 0 && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            ℹ️ After performing a gig, mark it as completed to build your verified gig history. The gig becomes verified once both you and the venue confirm.
          </p>
        </div>
      )}
    </div>
  )
}
