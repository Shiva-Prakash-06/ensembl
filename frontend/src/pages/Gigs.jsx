/**
 * Gigs Page
 * Browse and apply to gigs
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Gigs() {
  const { user } = useAuth()
  const [gigs, setGigs] = useState([])
  const [ensembles, setEnsembles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEnsemble, setSelectedEnsemble] = useState(null)

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
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (gigId) => {
    if (!selectedEnsemble) {
      alert('Please select an ensemble first')
      return
    }

    try {
      await api.applyToGig(gigId, { ensemble_id: selectedEnsemble })
      alert('Application submitted!')
      loadData() // Reload to update gig status
    } catch (error) {
      console.error('Failed to apply:', error)
      alert(error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gig Board</h1>
        <p className="text-gray-600 mt-1">Find gigs and apply with your ensemble</p>
      </div>

      {/* Ensemble Selector */}
      {ensembles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apply with ensemble:
          </label>
          <select
            value={selectedEnsemble || ''}
            onChange={(e) => setSelectedEnsemble(parseInt(e.target.value))}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select an ensemble...</option>
            {ensembles.map((ens) => (
              <option key={ens.id} value={ens.id}>
                {ens.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Gigs List */}
      {gigs.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No gigs available at the moment
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{gig.title}</h3>
                <p className="text-gray-600">{gig.venue.name}</p>
                <p className="text-sm text-gray-500">📍 {gig.venue.location}</p>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="text-gray-600">
                    {new Date(gig.date_time).toLocaleDateString()} at{' '}
                    {new Date(gig.date_time).toLocaleTimeString()}
                  </span>
                </div>
                {gig.payment_description && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Payment:</span>
                    <span className="text-gray-600">{gig.payment_description}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-4">{gig.description}</p>

              {gig.is_open ? (
                <button
                  onClick={() => handleApply(gig.id)}
                  disabled={!selectedEnsemble || ensembles.length === 0}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ensembles.length === 0 ? 'Create an ensemble to apply' : 'Apply with Ensemble'}
                </button>
              ) : (
                <div className="text-center py-2 text-gray-500 font-medium">
                  Applications Closed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
