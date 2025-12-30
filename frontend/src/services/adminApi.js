/**
 * Admin API Service
 * API calls for admin dashboard
 * 
 * IMPORTANT: All requests require X-User-Id header with admin user ID
 */

const API_BASE_URL = 'http://localhost:5000/api'

class AdminAPI {
  constructor() {
    this.adminUserId = localStorage.getItem('adminUserId') || null
  }

  /**
   * Set admin user ID for authenticated requests
   */
  setAdminUser(userId) {
    this.adminUserId = userId
    localStorage.setItem('adminUserId', userId)
  }

  /**
   * Clear admin authentication
   */
  clearAdminUser() {
    this.adminUserId = null
    localStorage.removeItem('adminUserId')
  }

  /**
   * Get headers with admin authentication
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (this.adminUserId) {
      headers['X-User-Id'] = this.adminUserId
    }
    
    return headers
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // ===== ANALYTICS =====

  async getAnalytics() {
    const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ===== USERS =====

  async getUsers(page = 1, filters = {}) {
    const params = new URLSearchParams({
      page,
      per_page: 20,
      ...filters
    })
    
    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async getUserDetail(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async toggleUserActive(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
      method: 'POST',
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ===== VENUES =====

  async getVenues(page = 1) {
    const params = new URLSearchParams({ page, per_page: 20 })
    
    const response = await fetch(`${API_BASE_URL}/admin/venues?${params}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ===== ENSEMBLES =====

  async getEnsembles(page = 1) {
    const params = new URLSearchParams({ page, per_page: 20 })
    
    const response = await fetch(`${API_BASE_URL}/admin/ensembles?${params}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ===== GIGS =====

  async getGigs(page = 1, filters = {}) {
    const params = new URLSearchParams({
      page,
      per_page: 20,
      ...filters
    })
    
    const response = await fetch(`${API_BASE_URL}/admin/gigs?${params}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async toggleGigOpen(gigId) {
    const response = await fetch(`${API_BASE_URL}/admin/gigs/${gigId}/toggle-open`, {
      method: 'POST',
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ===== ADMIN AUTH =====

  async verifyAdminAccess(userId) {
    try {
      this.setAdminUser(userId)
      // Try to fetch analytics as a test
      await this.getAnalytics()
      return true
    } catch (error) {
      this.clearAdminUser()
      return false
    }
  }
}

export default new AdminAPI()
