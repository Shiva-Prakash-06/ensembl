/**
 * Venue Profile Page
 * View venue details (placeholder for MVP)
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function VenueProfile() {
  const { venueId } = useParams()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenue()
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
      </div>
    </div>
  )
}
