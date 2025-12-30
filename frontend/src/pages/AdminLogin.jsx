/**
 * Admin Login Page
 * Simple authentication for internal admin access
 * 
 * NOTE: In production, this should use proper authentication
 * For MVP, we use user ID from seed script
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminLogin() {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify admin access
      const isAdmin = await adminApi.verifyAdminAccess(userId)
      
      if (isAdmin) {
        navigate('/admin/dashboard')
      } else {
        setError('Invalid admin credentials or insufficient permissions')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ensembl Admin
            </h1>
            <p className="text-gray-600 text-sm">
              Internal platform oversight
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Internal Use Only</strong><br />
              This admin panel is for authorized personnel only.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin User ID
              </label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your admin user ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtain this from the seed_admin.py script
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Ethics Note */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This admin system observes ethical boundaries:<br />
              No private messages, no hard deletes, all actions reversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
