/**
 * Venue Dashboard Page
 * For venue users to create gigs and manage applications
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function VenueDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreatingGig, setIsCreatingGig] = useState(false)
  const [isCreatingVenue, setIsCreatingVenue] = useState(false)
  const [newGig, setNewGig] = useState({
    title: '',
    date_time: '',
    payment_description: '',
    description: '',
  })
  const [newVenue, setNewVenue] = useState({
    name: user?.name || '',
    location: user?.city || '',
    vibe_tags: '',
    tech_specs: '',
    description: '',
  })

  useEffect(() => {
    if (user?.role !== 'venue') {
      navigate('/')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      // Try to load venue profile
      const venueData = await api.getVenueByUser(user.id)
      setVenue(venueData)
      
      // Load gigs for this venue
      const gigsData = await api.getGigs()
      const myGigs = gigsData.gigs.filter(g => g.venue.id === venueData.id)
      setGigs(myGigs)
    } catch (error) {
      // Venue profile doesn't exist yet
      console.log('No venue profile found')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVenue = async (e) => {
    e.preventDefault()
    try {
      await api.createVenue({
        ...newVenue,
        user_id: user.id,
      })
      setIsCreatingVenue(false)
      loadData()
    } catch (error) {
      console.error('Failed to create venue:', error)
      alert(error.message)
    }
  }

  const handleCreateGig = async (e) => {
    e.preventDefault()
    try {
      await api.createGig({
        ...newGig,
        venue_id: venue.id,
      })
      setIsCreatingGig(false)
      setNewGig({
        title: '',
        date_time: '',
        payment_description: '',
        description: '',
      })
      loadData()
    } catch (error) {
      console.error('Failed to create gig:', error)
      alert(error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  // If no venue profile exists, show creation form
  if (!venue) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Venue Profile</h1>
          <p className="text-gray-600 mb-6">Set up your venue profile to start posting gigs</p>
          
          <form onSubmit={handleCreateVenue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name *
              </label>
              <input
                type="text"
                required
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={newVenue.location}
                onChange={(e) => setNewVenue({ ...newVenue, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vibe Tags
              </label>
              <input
                type="text"
                value={newVenue.vibe_tags}
                onChange={(e) => setNewVenue({ ...newVenue, vibe_tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Jazz, Intimate, Underground (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tech Specs
              </label>
              <textarea
                rows="3"
                value={newVenue.tech_specs}
                onChange={(e) => setNewVenue({ ...newVenue, tech_specs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="PA system, backline, instruments available, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="4"
                value={newVenue.description}
                onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tell musicians about your venue..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Create Venue Profile
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
          <p className="text-gray-600 mt-1">Manage your gigs and applications</p>
        </div>
        <button
          onClick={() => setIsCreatingGig(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Post New Gig
        </button>
      </div>

      {/* Create Gig Modal/Form */}
      {isCreatingGig && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Post a New Gig</h2>
          <form onSubmit={handleCreateGig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gig Title *
              </label>
              <input
                type="text"
                required
                value={newGig.title}
                onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Friday Night Jazz Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={newGig.date_time}
                onChange={(e) => setNewGig({ ...newGig, date_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Info
              </label>
              <input
                type="text"
                value={newGig.payment_description}
                onChange={(e) => setNewGig({ ...newGig, payment_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., $200 for the band, door split, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows="4"
                value={newGig.description}
                onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the gig, what you're looking for, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingGig(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Post Gig
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gigs List */}
      {gigs.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No gigs posted yet. Create your first gig!
        </div>
      ) : (
        <div className="space-y-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{gig.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(gig.date_time).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  gig.is_open 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {gig.is_open ? 'Accepting Applications' : 'Closed'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{gig.description}</p>
              
              {gig.payment_description && (
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Payment:</span> {gig.payment_description}
                </p>
              )}

              {/* TODO: Show applications for this gig */}
              <div className="text-sm text-gray-500">
                View applications (coming soon)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
