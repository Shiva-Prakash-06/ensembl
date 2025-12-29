import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import EnsembleInviteModal from './EnsembleInviteModal'; // <--- IMPORT THIS

export default function JamPostCard({ post, onMessage, currentUserId }) {
  const [isHandRaised, setIsHandRaised] = useState(post.has_raised_hand);
  const [interestCount, setInterestCount] = useState(post.interest_count || 0);
  const [loading, setLoading] = useState(false);
  
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [interestedMusicians, setInterestedMusicians] = useState([]);

  // NEW: State for Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);

  const isAuthor = currentUserId === post.author.id;
  const navigate = useNavigate();

  const handleRaiseHand = async () => {
    if (!currentUserId) {
        alert("Please login to raise your hand");
        return;
    }
    setLoading(true);
    try {
        const data = await api.toggleRaiseHand(post.id, currentUserId);
        setIsHandRaised(data.has_raised_hand);
        setInterestCount(data.count);
    } catch (error) {
        console.error("Error raising hand:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleViewInterested = async () => {
    try {
        const data = await api.getInterestedMusicians(post.id);
        setInterestedMusicians(data.interested_musicians);
        setShowInterestedModal(true);
    } catch (error) {
        console.error("Failed to load interested musicians", error);
    }
  };

  const openInviteModal = (musician) => {
      setInviteTarget(musician);
      setShowInviteModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition mb-4 relative">
      {/* Author Info */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-indigo-600 font-semibold text-lg">
            {post.author.name ? post.author.name.charAt(0) : "?"}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{post.author.name || "Unknown"}</h3>
          <p className="text-sm text-gray-500">{post.author.instrument || "Musician"}</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Looking for:</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {post.looking_for_instrument}
          </span>
          {post.genre && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {post.genre}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-2">{post.description}</p>
        <p className="text-sm text-gray-500">📍 {post.location}</p>
      </div>

      {/* Action Buttons (Non-Author) */}
      {!isAuthor && (
          <div className="flex gap-3">
            <button
                onClick={() => onMessage(post.author.id)}
                className="flex-1 border border-indigo-600 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 transition font-medium"
            >
                Message
            </button>
            <button
                onClick={handleRaiseHand}
                disabled={loading}
                className={`flex-1 py-2 rounded-lg transition font-medium text-white ${
                    isHandRaised 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
                {isHandRaised ? "✋ Hand Raised!" : "✋ Raise Hand"}
                <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                    {interestCount}
                </span>
            </button>
          </div>
      )}
      
      {/* Author View: "View Interested" Button */}
      {isAuthor && (
          <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 italic">
                    {interestCount} musician{interestCount !== 1 ? 's' : ''} interested
                </span>
                <button 
                    onClick={handleViewInterested}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
                >
                    View List
                </button>
              </div>
          </div>
      )}

      {/* Interested Musicians Modal */}
      {showInterestedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Interested Musicians</h3>
                    <button onClick={() => setShowInterestedModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                
                {interestedMusicians.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No one has raised their hand yet.</p>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {interestedMusicians.map(musician => (
                            <div key={musician.id} className="flex flex-col bg-gray-50 p-3 rounded-lg gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">{musician.name}</p>
                                        <p className="text-xs text-gray-500">{musician.instrument}</p>
                                    </div>
                                    <button 
                                        onClick={() => openInviteModal(musician)}
                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                                    >
                                        + Invite
                                    </button>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => navigate(`/profile/${musician.id}`)}
                                        className="flex-1 text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                                    >
                                        Profile
                                    </button>
                                    <button 
                                        onClick={() => onMessage(musician.id)}
                                        className="flex-1 text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50"
                                    >
                                        Message
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* The Invite Modal */}
      <EnsembleInviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        targetUser={inviteTarget}
        currentUserId={currentUserId}
      />
    </div>
  )
}