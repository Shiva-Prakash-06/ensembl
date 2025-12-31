/**
 * API Configuration
 * Centralized API base URL and request helpers
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Generic API request helper
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'API request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const api = {
  // Auth
  googleLogin: (data) => apiRequest('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
  emailLogin: (data) => apiRequest('/auth/email', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  
  // Users
  getUser: (userId) => apiRequest(`/users/${userId}`),
  updateUser: (userId, data) => apiRequest(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  searchUsers: (params) => apiRequest(`/users/search?${new URLSearchParams(params)}`),
  
  // Jam Board
  getJamPosts: (params = {}) => {
    const queryParams = typeof params === 'object' ? params : { user_id: params };
    const cleanParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v != null)
    );
    return apiRequest(`/jam-board/?${new URLSearchParams(cleanParams)}`)
  },
  
  createJamPost: (data) => apiRequest('/jam-board/', { method: 'POST', body: JSON.stringify(data) }),
  deleteJamPost: (postId) => apiRequest(`/jam-board/${postId}`, { method: 'DELETE' }),

  toggleRaiseHand: (postId, userId) => apiRequest(`/jam-board/${postId}/raise-hand`, { 
      method: 'POST', 
      body: JSON.stringify({ user_id: userId }) 
  }),

  // Get list of interested people
  getInterestedMusicians: (postId) => apiRequest(`/jam-board/${postId}/interested`),
  
  // Chat
  getConversations: (userId) => apiRequest(`/chat/conversations/${userId}`),
  getMessages: (userId, otherId) => apiRequest(`/chat/messages/${userId}/${otherId}`),
  sendMessage: (data) => apiRequest('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  
  // NEW: Mark conversation as read (clears notification)
  markConversationAsRead: (userId, otherUserId) => apiRequest(`/chat/mark-read/conversation/${userId}/${otherUserId}`, { method: 'PUT' }),

  // Get unread count
  getUnreadCount: (userId) => apiRequest(`/chat/unread-count/${userId}`),
  

  // Ensembles
  createEnsemble: (data) => apiRequest('/ensembles/', { method: 'POST', body: JSON.stringify(data) }),
  getEnsemble: (ensembleId) => apiRequest(`/ensembles/${ensembleId}`),
  getUserEnsembles: (userId) => apiRequest(`/ensembles/user/${userId}`),
  
  // NEW: Invite logic
  inviteMember: (ensembleId, userId) => apiRequest(`/ensembles/${ensembleId}/invite`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  
  acceptInvite: (ensembleId, userId) => apiRequest(`/ensembles/${ensembleId}/accept`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  
  // ... existing code ...

  // Update this line in the api object:
  declineInvite: (ensembleId, userId, requesterId) => 
      apiRequest(`/ensembles/${ensembleId}/invites/${userId}?requester_id=${requesterId}`, { method: 'DELETE' }),

  // ... existing code ...
  
  // Update this line in the api object:
  removeMember: (ensembleId, userId, requesterId) => 
      apiRequest(`/ensembles/${ensembleId}/members/${userId}?requester_id=${requesterId}`, { method: 'DELETE' }),

  // Gigs
  getGigs: (params = {}) => apiRequest(`/gigs/?${new URLSearchParams(params)}`),
  createGig: (data) => apiRequest('/gigs/', { method: 'POST', body: JSON.stringify(data) }),
  applyToGig: (gigId, data) => apiRequest(`/gigs/${gigId}/apply`, { method: 'POST', body: JSON.stringify(data) }),
  getGigApplications: (gigId) => apiRequest(`/gigs/${gigId}/applications`),
  acceptApplication: (appId) => apiRequest(`/gigs/applications/${appId}/accept`, { method: 'PUT' }),
  rejectApplication: (appId) => apiRequest(`/gigs/applications/${appId}/reject`, { method: 'PUT' }),
  confirmGig: (appId, data) => apiRequest(`/gigs/applications/${appId}/confirm`, { method: 'PUT', body: JSON.stringify(data) }),
  markGigCompleted: (gigId) => apiRequest(`/gigs/${gigId}/mark-completed`, { method: 'PUT' }),
  
  // Venues
  getVenues: () => apiRequest('/venues/'),
  createVenue: (data) => apiRequest('/venues/', { method: 'POST', body: JSON.stringify(data) }),
  getVenue: (venueId) => apiRequest(`/venues/${venueId}`),
  getVenueByUser: (userId) => apiRequest(`/venues/user/${userId}`),
  updateVenue: (venueId, data) => apiRequest(`/venues/${venueId}`, { method: 'PUT', body: JSON.stringify(data) }),
}

export default api