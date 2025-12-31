/**
 * Gigs Page
 * Browse and apply to gigs
 * 
 * Phase 2: Enhanced with better microcopy and ensemble credibility display
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useFeedbackBanner } from '../components/FeedbackBanner'

export default function Gigs() {
  const { user } = useAuth()
  const { banner, showBanner } = useFeedbackBanner()
  const [gigs, setGigs] = useState([])
  const [ensembles, setEnsembles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEnsemble, setSelectedEnsemble] = useState(null)
  const [selectedEnsembleData, setSelectedEnsembleData] = useState(null)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      const [gigsData, ensemblesData] = await Promise.all([
        api.getGigs(),
        api.getUserEnsembles(user.id),
      ])
      setGigs(gigsData.gigs)
      setEnsembles(ensemblesData.ensembles)
      
      // Pre-select first ensemble if available
      if (ensemblesData.ensembles.length > 0 && !selectedEnsemble) {
        setSelectedEnsemble(ensemblesData.ensembles[0].id)
        setSelectedEnsembleData(ensemblesData.ensembles[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnsembleChange = (ensembleId) => {
    const id = parseInt(ensembleId)
    setSelectedEnsemble(id)
    const ensemble = ensembles.find(e => e.id === id)
    setSelectedEnsembleData(ensemble || null)
  }

  const handleApply = async (gigId) => {
    if (!selectedEnsemble) {
      showBanner('warning', 'Please select an ensemble first')
      return
    }

    try {
      await api.applyToGig(gigId, { ensemble_id: selectedEnsemble })
      showBanner('success', 'Application submitted! The venue will review your ensemble profile.')
      loadData() // Reload to update gig status
    } catch (error) {
      console.error('Failed to apply:', error)
      showBanner('error', error.message || 'Failed to submit application')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      {/* Feedback Banner */}
      {banner}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gig Board</h1>
        <p className="text-gray-600 mt-1">Find gigs and apply with your ensemble</p>
      </div>

      {/* Ensemble Selector with Credibility Preview */}
      {ensembles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Applying as:
          </label>
          <select
            value={selectedEnsemble || ''}
            onChange={(e) => handleEnsembleChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900"
          >
            {ensembles.map((ens) => (
              <option key={ens.id} value={ens.id}>
                {ens.name} • {ens.members?.length || 0} members • {ens.verified_gig_count || 0} verified gigs
              </option>
            ))}
          </select>

          {/* Selected Ensemble Preview */}
          {selectedEnsembleData && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Venues will see your ensemble profile:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnsembleData.members?.map((member, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {member.name} • {member.instrument || 'Musician'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg px-4 py-2 text-center">
                  <div className="text-xl font-bold text-indigo-600">
                    {selectedEnsembleData.verified_gig_count || 0}
                  </div>
                  <div className="text-xs text-indigo-700 font-medium">
                    Verified Gigs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Create an ensemble first</h3>
              <p className="text-yellow-800 text-sm mb-3">
                You need to create or join an ensemble before applying to gigs.
              </p>
              <button
                onClick={() => window.location.href = '/ensembles'}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
              >
                Go to Ensembles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gigs List */}
      {gigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center animate-fade-in">
          <div className="text-gray-400 text-5xl mb-4">🎤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs on the board yet</h3>
          <p className="text-gray-600">
            The gig board is quiet right now. Check back soon—new opportunities drop daily!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 card-hover-lift transition animate-fade-in">
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{gig.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    gig.status === 'completed'
                      ? 'bg-purple-100 text-purple-700'
                      : gig.status === 'accepted'
                      ? 'bg-blue-100 text-blue-700'
                      : gig.is_open 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {gig.status === 'completed' ? 'COMPLETED' : gig.status === 'accepted' ? 'BOOKED' : gig.is_open ? 'OPEN' : 'APPS CLOSED'}
                  </span>
                </div>
                <p className="text-gray-700 font-medium">{gig.venue.name}</p>
                <p className="text-sm text-gray-500">📍 {gig.venue.location}</p>
              </div>

              <div className="mb-4 space-y-2 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">📅 Date:</span>
                  <span className="text-gray-600">
                    {new Date(gig.date_time).toLocaleDateString()} at{' '}
                    {new Date(gig.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {gig.payment_description && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">💰 Payment:</span>
                    <span className="text-gray-600">{gig.payment_description}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-4 line-clamp-3">{gig.description}</p>

              {gig.is_open ? (
                <button
                  onClick={() => handleApply(gig.id)}
                  disabled={!selectedEnsemble || ensembles.length === 0}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm button-press"
                >
                  {ensembles.length === 0 ? 'Create Ensemble to Apply' : 'Apply as Ensemble'}
                </button>
              ) : (
                <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-600 font-medium">Applications Closed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
