/**
 * Ensembles Page
 * View and manage ensembles
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Ensembles() {
  const { user } = useAuth()
  const [ensembles, setEnsembles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newEnsemble, setNewEnsemble] = useState({
    name: '',
    member_ids: [],
  })

  useEffect(() => {
    loadEnsembles()
  }, [user?.id])

  const loadEnsembles = async () => {
    try {
      const data = await api.getUserEnsembles(user.id)
      setEnsembles(data.ensembles)
    } catch (error) {
      console.error('Failed to load ensembles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEnsemble = async (e) => {
    e.preventDefault()
    try {
      await api.createEnsemble({
        ...newEnsemble,
        leader_id: user.id,
      })
      setIsCreating(false)
      setNewEnsemble({ name: '', member_ids: [] })
      loadEnsembles()
    } catch (error) {
      console.error('Failed to create ensemble:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Ensembles</h1>
          <p className="text-gray-600 mt-1">Manage your musical groups</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Create Ensemble
        </button>
      </div>

      {/* Create Ensemble Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Ensemble</h2>
          <form onSubmit={handleCreateEnsemble}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ensemble Name *
              </label>
              <input
                type="text"
                required
                value={newEnsemble.name}
                onChange={(e) => setNewEnsemble({ ...newEnsemble, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., The Jazz Cats"
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              You can add members after creating the ensemble
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ensembles List */}
      {ensembles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You're not part of any ensembles yet</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Create your first ensemble
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ensembles.map((ensemble) => (
            <div key={ensemble.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{ensemble.name}</h3>
                  {ensemble.leader_id === user.id && (
                    <span className="text-sm text-indigo-600">Leader</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {ensemble.verified_gig_count} verified gig{ensemble.verified_gig_count !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Members */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Members</h4>
                <div className="space-y-2">
                  {ensemble.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-xs font-semibold">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.instrument}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TODO: Add member management for leader */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
