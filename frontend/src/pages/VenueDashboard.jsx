/**
 * Venue Dashboard Page
 * 
 * Phase 2: Venue Confidence & Booking Readiness
 * Enhanced dashboard for venues to manage gigs and review applications
 * 
 * Features:
 * - Active gigs overview with application counts
 * - Pending applications section with credibility signals
 * - Accepted ensembles tracking
 * - Verified gig count display
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import EnsembleApplicationCard from '../components/EnsembleApplicationCard'
import ActivityFeed from '../components/ActivityFeed'
import { useFeedbackBanner } from '../components/FeedbackBanner'

export default function VenueDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { banner, showBanner } = useFeedbackBanner()
  const [venue, setVenue] = useState(null)
  const [gigs, setGigs] = useState([])
  const [applications, setApplications] = useState({}) // gigId -> applications array
  const [loading, setLoading] = useState(true)
  const [isCreatingGig, setIsCreatingGig] = useState(false)
  const [isCreatingVenue, setIsCreatingVenue] = useState(false)
  const [expandedGig, setExpandedGig] = useState(null) // Track which gig's applications are shown
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

      // Load applications for each gig
      const applicationsData = {}
      for (const gig of myGigs) {
        try {
          const apps = await api.getGigApplications(gig.id)
          applicationsData[gig.id] = apps.applications || []
        } catch (error) {
          console.error(`Failed to load applications for gig ${gig.id}:`, error)
          applicationsData[gig.id] = []
        }
      }
      setApplications(applicationsData)
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
      showBanner('success', 'Venue profile created! You can now post gigs.')
      loadData()
    } catch (error) {
      console.error('Failed to create venue:', error)
      showBanner('error', error.message)
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
      showBanner('success', 'Gig posted! Ensembles can now apply.')
      loadData()
    } catch (error) {
      console.error('Failed to create gig:', error)
      showBanner('error', error.message)
    }
  }

  // ... (imports remain the same)

// ... (inside VenueDashboard component)

  const handleAcceptApplication = async (applicationId) => {
    try {
      // 1. Call API to accept
      const response = await api.acceptApplication(applicationId)
      
      showBanner('success', 'Application accepted! Chat is now open.')
      
      // 2. Redirect to Chat with the Ensemble Leader
      // The backend now returns 'chat_with_id'
      if (response.chat_with_id) {
          // Small delay to let the banner be seen, then go
          setTimeout(() => {
              navigate(`/chat/${response.chat_with_id}`);
          }, 1000);
      } else {
          // Fallback if ID missing for some reason
          loadData(); 
      }

    } catch (error) {
      console.error('Failed to accept application:', error)
      showBanner('error', error.message)
    }
  }

// ... (rest of the file remains the same)

  const handleRejectApplication = async (applicationId) => {
    try {
      await api.rejectApplication(applicationId)
      showBanner('info', 'Application declined.')
      loadData() // Reload to update status
    } catch (error) {
      console.error('Failed to reject application:', error)
      showBanner('error', error.message)
    }
  }

  const toggleGigApplications = (gigId) => {
    setExpandedGig(expandedGig === gigId ? null : gigId)
  }

  // Helper to get application counts
  const getApplicationCounts = (gigId) => {
    const apps = applications[gigId] || []
    return {
      total: apps.length,
      pending: apps.filter(a => a.status === 'pending').length,
      accepted: apps.filter(a => a.status === 'accepted').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
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
      {/* Feedback Banner */}
      {banner}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Dashboard Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
              <p className="text-gray-600 mt-1">{venue.location}</p>
              
              {/* Venue Credibility Signal */}
              <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold text-indigo-600">
                  {venue.verified_gig_count || 0}
                </span>
                <span className="text-sm font-medium text-indigo-700">
                  Verified Gigs Hosted
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCreatingGig(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm button-press"
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

      {/* Gigs List with Enhanced Application View */}
      {gigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🎤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs posted yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first gig to start receiving ensemble applications
          </p>
          <button
            onClick={() => setIsCreatingGig(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Post Your First Gig
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {gigs.map((gig) => {
            const counts = getApplicationCounts(gig.id)
            const isExpanded = expandedGig === gig.id
            const gigApplications = applications[gig.id] || []

            return (
              <div key={gig.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Gig Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{gig.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        📅 {new Date(gig.date_time).toLocaleDateString()} at{' '}
                        {new Date(gig.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      gig.is_open 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {gig.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{gig.description}</p>
                  
                  {gig.payment_description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Payment:</span> {gig.payment_description}
                    </p>
                  )}

                  {/* Application Summary */}
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Total Applications:</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-900">
                        {counts.total}
                      </span>
                    </div>
                    {counts.pending > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-600">Pending:</span>
                        <span className="bg-orange-100 px-3 py-1 rounded-full font-bold text-orange-700">
                          {counts.pending}
                        </span>
                      </div>
                    )}
                    {counts.accepted > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">Accepted:</span>
                        <span className="bg-green-100 px-3 py-1 rounded-full font-bold text-green-700">
                          {counts.accepted}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Applications Button */}
                  {counts.total > 0 && (
                    <button
                      onClick={() => toggleGigApplications(gig.id)}
                      className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2"
                    >
                      {isExpanded ? '▼ Hide Applications' : `▶ View ${counts.total} Application${counts.total !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>

                {/* Applications Section */}
                {isExpanded && gigApplications.length > 0 && (
                  <div className="bg-gray-50 p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      Ensemble Applications
                    </h4>
                    
                    {/* Pending Applications */}
                    {counts.pending > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          ⏳ Pending Review ({counts.pending})
                        </h5>
                        <div className="space-y-4">
                          {gigApplications
                            .filter(app => app.status === 'pending')
                            .map(app => (
                              <EnsembleApplicationCard
                                key={app.id}
                                application={app}
                                onAccept={handleAcceptApplication}
                                onReject={handleRejectApplication}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Accepted Applications */}
                    {counts.accepted > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">
                          ✓ Accepted ({counts.accepted})
                        </h5>
                        <div className="space-y-4">
                          {gigApplications
                            .filter(app => app.status === 'accepted')
                            .map(app => (
                              <EnsembleApplicationCard
                                key={app.id}
                                application={app}
                                onAccept={handleAcceptApplication}
                                onReject={handleRejectApplication}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Applications */}
                    {counts.rejected > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Declined ({counts.rejected})
                        </h5>
                        <div className="space-y-4">
                          {gigApplications
                            .filter(app => app.status === 'rejected')
                            .map(app => (
                              <EnsembleApplicationCard
                                key={app.id}
                                application={app}
                                onAccept={handleAcceptApplication}
                                onReject={handleRejectApplication}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State for No Applications */}
                {isExpanded && gigApplications.length === 0 && (
                  <div className="bg-gray-50 p-6 text-center">
                    <p className="text-gray-500">No applications yet for this gig</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
        </div>

        {/* Sidebar - Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
