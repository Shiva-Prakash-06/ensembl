/**
 * Chat Page
 * Minimal 1-to-1 text messaging with Ensemble Invites
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import EnsembleInviteModal from '../components/EnsembleInviteModal'
import AlertModal from '../components/AlertModal'

export default function Chat() {
  const { userId: chatWithUserId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  // Alert State
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' })

  useEffect(() => {
    loadConversations()
  }, [user?.id])

  useEffect(() => {
    if (chatWithUserId) {
      selectConversation(chatWithUserId)
    }
  }, [chatWithUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const showAlert = (message, type = 'success') => {
      setAlertState({ isOpen: true, message, type });
  };

  const loadConversations = async () => {
    try {
      const data = await api.getConversations(user.id)
      setConversations(data.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (otherUserId) => {
    try {
      const targetId = parseInt(otherUserId);
      let otherUser = conversations.find(c => c.id === targetId)
      
      if (!otherUser) {
        const data = await api.getUser(targetId)
        otherUser = data
        setConversations(prev => {
            if (prev.some(c => c.id === targetId)) return prev;
            return [...prev, otherUser];
        })
      }

      setSelectedUser(otherUser)
      
      const messagesData = await api.getMessages(user.id, targetId)
      setMessages(messagesData.messages)

      await api.markConversationAsRead(user.id, targetId)

    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    try {
      await api.sendMessage({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: newMessage,
      })
      // Append message locally for instant feedback
      const messagesData = await api.getMessages(user.id, selectedUser.id)
      setMessages(messagesData.messages)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // --- NEW: Callback to refresh chat when invite is sent ---
  const handleInviteSent = async () => {
      if (selectedUser) {
          // Refresh messages to show the new invite bubble immediately
          const messagesData = await api.getMessages(user.id, selectedUser.id);
          setMessages(messagesData.messages);
      }
  };

  // --- UPDATED INVITE HANDLERS ---

  const handleAcceptInvite = async (ensembleId, messageId) => {
    try {
        await api.acceptInvite(ensembleId, user.id);
        
        // Update local state to show "Joined" instead of buttons
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, localStatus: 'accepted' };
            }
            return msg;
        }));

        showAlert("You have joined the ensemble!", "success");

    } catch (error) {
        // Smart Error Handling: If already joined, just update the UI
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, localStatus: 'accepted' };
            }
            return msg;
        }));
    }
  };

  const handleDeclineInvite = async (ensembleId, messageId) => {
    try {
        // UPDATED LINE: Pass user.id as the 3rd argument (requesterId)
        await api.declineInvite(ensembleId, user.id, user.id);
        
        // Update local state to show "Declined"
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, localStatus: 'declined' };
            }
            return msg;
        }));

    } catch (error) {
        // Catch the 404 Error (User not found in invites)
        console.warn("Invite already removed or invalid:", error);

        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, localStatus: 'declined' };
            }
            return msg;
        }));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet.
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedUser(conv)
                    selectConversation(conv.id)
                    navigate(`/chat/${conv.id}`, { replace: true })
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    selectedUser?.id === conv.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {conv.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{conv.name}</p>
                      <p className="text-sm text-gray-500">{conv.instrument}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                        {selectedUser.name.charAt(0)}
                    </span>
                    </div>
                    <div>
                    <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.instrument}</p>
                    </div>
                </div>
                
                {/* UPDATED: Only show Invite button if current user is a MUSICIAN */}
                {user?.role === 'musician' && (
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition"
                    >
                        + Invite to Ensemble
                    </button>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                  // Determine status: prefer local optimistic update, then fallback to DB status
                  const status = msg.localStatus || msg.invite_status || 'pending';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          msg.sender_id === user.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {msg.msg_type === 'invite' ? (
                          <div className="text-center">
                            <p className="font-medium mb-2">{msg.content}</p>
                            
                            {/* Logic: Show buttons OR Status Message */}
                            {msg.receiver_id === user.id && (
                              <div className="mt-2">
                                  {status === 'accepted' ? (
                                      <div className="text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded border border-green-200">
                                          ✓ Successfully Joined
                                      </div>
                                  ) : status === 'declined' ? (
                                      <div className="text-gray-500 text-sm font-bold bg-gray-100 px-3 py-1 rounded border border-gray-200">
                                          ✕ Invite Declined
                                      </div>
                                  ) : (
                                      <div className="flex gap-2 justify-center">
                                          <button 
                                              onClick={() => handleAcceptInvite(msg.related_id, msg.id)}
                                              className="bg-green-500 text-white text-xs px-3 py-1.5 rounded hover:bg-green-600 transition shadow-sm"
                                          >
                                              Accept
                                          </button>
                                          <button 
                                              onClick={() => handleDeclineInvite(msg.related_id, msg.id)}
                                              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600 transition shadow-sm"
                                          >
                                              Decline
                                          </button>
                                      </div>
                                  )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user.id ? 'text-indigo-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Selection Modal */}
      <EnsembleInviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        targetUser={selectedUser}
        currentUserId={user?.id}
        onInviteSent={handleInviteSent}
      />

      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  )
}