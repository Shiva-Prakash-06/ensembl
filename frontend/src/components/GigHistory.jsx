/**
 * Gig History Component
 * Phase 2 Fix: Shows actual verified gig history (source of truth)
 * 
 * Replaces hardcoded verified_gig_count with real data from /api/history
 * Displays completed gigs with metadata for musicians and venues
 * 
 * STRICT SCOPE: No payments, ratings, or redesign - just show state
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function GigHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadHistory()
    }
  }, [user?.id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data
      if (user.role === 'musician') {
        data = await api.getMusicianHistory()
      } else if (user.role === 'venue') {
        data = await api.getVenueHistory()
      } else {
        setError('Invalid user role')
        return
      }
      
      // Defensive check - always expect structured response
      setHistory(data?.history || [])
      setVerifiedCount(data?.verified_count || 0)
      
    } catch (err) {
      console.error('Failed to load gig history:', err)
      setError(err.message || 'Failed to load history')
      // Set safe defaults on error
      setHistory([])
      setVerifiedCount(0)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status, verified) => {
    if (verified) {
      return 'bg-purple-100 text-purple-700'
    }
    if (status === 'completed') {
      return 'bg-blue-100 text-blue-700'
    }
    if (status === 'accepted') {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status, verified) => {
    if (verified) return 'Verified'
    if (status === 'completed') return 'Completed'
    if (status === 'accepted') return 'Active'
    return 'Open'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gig History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gig History</h2>
        <div className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={loadHistory}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Verified Count */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gig History</h2>
        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-600">{verifiedCount}</div>
          <div className="text-sm text-gray-600">Verified Gigs</div>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-gray-500">No gig history yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {user.role === 'musician' 
              ? 'Apply to gigs to build your history'
              : 'Post and complete gigs to build your history'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.gig_title}</h3>
                  
                  {user.role === 'musician' && (
                    <>
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {item.venue_name}, {item.venue_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        🎭 {item.ensemble_name}
                      </p>
                    </>
                  )}
                  
                  {user.role === 'venue' && item.ensemble_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      🎭 {item.ensemble_name}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status, item.verified)}`}>
                  {getStatusText(item.status, item.verified)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      {verifiedCount > 0 && (
        <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-700">
            ✓ Verified gigs are completed gigs confirmed by both venue and ensemble
          </p>
        </div>
      )}
    </div>
  )
}
