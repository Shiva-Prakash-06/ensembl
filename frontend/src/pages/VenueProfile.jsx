/**
 * Venue Profile Page
 * View venue details with gig history
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function VenueProfile() {
  const { venueId } = useParams()
  const [venue, setVenue] = useState(null)
  const [gigHistory, setGigHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenue()
    loadGigHistory()
  }, [venueId])

  const loadVenue = async () => {
    try {
      const data = await api.getVenue(venueId)
      setVenue(data)
    } catch (error) {
      console.error('Failed to load venue:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGigHistory = async () => {
    try {
      const data = await api.getVenueGigHistory(venueId)
      setGigHistory(data)
    } catch (error) {
      console.error('Failed to load gig history:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!venue) {
    return <div className="text-center py-12">Venue not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
        <p className="text-gray-600 mb-6">📍 {venue.location}</p>

        {/* Stats */}
        {gigHistory && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">{gigHistory.stats.total}</div>
              <div className="text-sm text-gray-600">Total Gigs</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{gigHistory.stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{gigHistory.stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{gigHistory.venue.verified_gig_count}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
          </div>
        )}

        {venue.vibe_tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Vibe</h3>
            <div className="flex flex-wrap gap-2">
              {venue.vibe_tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {venue.tech_specs && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Tech Specs</h3>
            <p className="text-gray-700">{venue.tech_specs}</p>
          </div>
        )}

        {venue.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-gray-700">{venue.description}</p>
          </div>
        )}

        {/* Gig History */}
        {gigHistory && gigHistory.gigs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Gig History</h3>
            <div className="space-y-3">
              {gigHistory.gigs.slice(0, 10).map((gig) => (
                <div key={gig.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{gig.title}</h4>
                      <p className="text-sm text-gray-500">
                        📅 {new Date(gig.date_time).toLocaleDateString()}
                      </p>
                      {gig.accepted_ensemble && (
                        <p className="text-sm text-indigo-600 mt-1">
                          🎵 {gig.accepted_ensemble.name} ({gig.accepted_ensemble.members_count} members)
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gig.status === 'completed' 
                        ? 'bg-purple-100 text-purple-700'
                        : gig.status === 'accepted'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {gig.status === 'completed' ? 'Completed' : gig.status === 'accepted' ? 'Active' : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
