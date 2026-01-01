import { useState, useEffect } from 'react';
import api from '../services/api';
import AlertModal from './AlertModal';

export default function EnsembleInviteModal({ isOpen, onClose, targetUser, currentUserId, onInviteSent }) {
  const [ensembles, setEnsembles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to prevent double-clicks

  // Alert State
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadMyEnsembles();
    }
  }, [isOpen, currentUserId]);

  const loadMyEnsembles = async () => {
    try {
      setLoading(true);
      const data = await api.getUserEnsembles(currentUserId);
      const myOwnedEnsembles = data.ensembles.filter(e => e.leader_id === currentUserId);
      setEnsembles(myOwnedEnsembles);
    } catch (error) {
      console.error("Failed to load ensembles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e, ensembleId) => {
    // Prevent event bubbling and double-clicks
    e.stopPropagation();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.inviteMember(ensembleId, targetUser.id);
      
      // 1. Refresh the Chat immediately (Backend update)
      if (onInviteSent) {
          onInviteSent();
      }

      // 2. Show Success Alert FIRST
      // We do NOT call onClose() here yet. We wait for the user to close the alert.
      setAlertState({
          isOpen: true,
          message: `Invite sent to ${targetUser.name}!`,
          type: 'success'
      });

    } catch (error) {
      // 3. Handle Error (e.g., User already in ensemble)
      setAlertState({
          isOpen: true,
          message: "Failed to send invite. They might already be a member or invited.",
          type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = () => {
      setAlertState({ ...alertState, isOpen: false });
      
      // Only close the main modal if the action was successful
      // If it was an error, we keep the modal open so they can try a different ensemble
      if (alertState.type === 'success') {
          onClose(); 
      }
  };

  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Invite {targetUser?.name}</h3>
            {/* Close button - disabled while submitting to prevent conflicts */}
            <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
                &times;
            </button>
            </div>

            {loading ? (
            <p className="text-gray-500 text-center">Loading your ensembles...</p>
            ) : ensembles.length === 0 ? (
            <div className="text-center">
                <p className="text-gray-600 mb-4">You don't have any ensembles yet.</p>
                <p className="text-sm text-gray-500">Go to "My Ensembles" to create one first.</p>
            </div>
            ) : (
            <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2">Select an ensemble to invite them to:</p>
                {ensembles.map(ensemble => (
                <button
                    key={ensemble.id}
                    onClick={(e) => handleInvite(e, ensemble.id)}
                    disabled={isSubmitting}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg transition flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="font-medium text-gray-900 group-hover:text-indigo-700">{ensemble.name}</span>
                    {isSubmitting ? (
                        <span className="text-xs text-gray-400">Sending...</span>
                    ) : (
                        <span className="text-xs text-gray-400 group-hover:text-indigo-500">Invite &rarr;</span>
                    )}
                </button>
                ))}
            </div>
            )}
        </div>
        </div>

        {/* The Alert Modal sits on top. When closed, it triggers handleAlertClose */}
        <AlertModal 
            isOpen={alertState.isOpen} 
            onClose={handleAlertClose}
            message={alertState.message}
            type={alertState.type}
        />
    </>
  );
}