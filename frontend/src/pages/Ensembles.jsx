/**
 * Ensembles Page
 * View and manage ensembles
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AlertModal from '../components/AlertModal'

export default function Ensembles() {
  const { user } = useAuth()
  const [ensembles, setEnsembles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form State
  const [newEnsemble, setNewEnsemble] = useState({
    name: '',
    member_ids: [],
  })

  // Alert/Confirmation State
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });
  const [pendingRemoval, setPendingRemoval] = useState(null); // Stores { ensembleId, userId, isSelf }

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

  // 1. Trigger Confirmation Modal
  const confirmRemoveMember = (ensembleId, memberId, isSelf = false) => {
      setPendingRemoval({ ensembleId, memberId, isSelf });
      setAlertState({
          isOpen: true,
          message: isSelf 
            ? "Are you sure you want to leave this ensemble?" 
            : "Are you sure you want to remove this member?",
          type: 'warning'
      });
  };

  // 2. Execute Removal
  // ... existing code ...

  // 2. Execute Removal
  const handleAlertClose = async () => {
      if (alertState.type === 'warning' && pendingRemoval) {
          try {
              // UPDATED LINE: Pass user.id as the 3rd argument (requesterId)
              await api.removeMember(pendingRemoval.ensembleId, pendingRemoval.memberId, user.id);
              
              setAlertState({
                  isOpen: true,
                  message: pendingRemoval.isSelf 
                    ? "You have left the ensemble." 
                    : "Member removed successfully.",
                  type: 'success'
              });
              
              loadEnsembles();
          } catch (error) {
              setAlertState({
                  isOpen: true,
                  message: "Failed to perform action.",
                  type: 'error'
              });
          } finally {
              setPendingRemoval(null);
          }
      } else {
          setAlertState({ ...alertState, isOpen: false });
      }
  };

  // ... rest of the file ...

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
            <div key={ensemble.id} className="bg-white rounded-lg shadow-md p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{ensemble.name}</h3>
                  {ensemble.leader_id === user.id ? (
                    <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">Leader</span>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">Member</span>
                  )}
                </div>
                
                {/* Leave Button (If I am NOT the leader) */}
                {ensemble.leader_id !== user.id && (
                    <button 
                        onClick={() => confirmRemoveMember(ensemble.id, user.id, true)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium underline"
                    >
                        Leave
                    </button>
                )}
              </div>

              {/* Members */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Members</h4>
                <div className="space-y-2">
                  {ensemble.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
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

                      {/* Remove Button: Only show if I am Leader AND removing someone else */}
                      {ensemble.leader_id === user.id && member.id !== user.id && (
                          <button 
                            onClick={() => confirmRemoveMember(ensemble.id, member.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition"
                            title="Remove Member"
                          >
                            Remove
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation/Alert Modal */}
     {/* ... (rest of the file above remains the same) ... */}

      {/* Confirmation/Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        // This is the "Confirm/OK" action
        onClose={handleAlertClose}
        // This is the "Cancel" action (Just close modal, do nothing else)
        onCancel={() => setAlertState({ ...alertState, isOpen: false })}
        message={alertState.message}
        type={alertState.type}
        // Only show Cancel button if it's a warning (question)
        showCancel={alertState.type === 'warning'}
      />
    </div>
  )
}