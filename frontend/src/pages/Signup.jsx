/**
 * Signup Page
 * Fast onboarding - only instrument + city required
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Signup() {
  const location = useLocation()
  const prefilledData = location.state || {}

  const [formData, setFormData] = useState({
    email: prefilledData.email || '',
    name: prefilledData.name || '',
    role: 'musician', // Default role
    instrument: '',
    city: '',
    google_id: prefilledData.google_id || null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.signup(formData)
      login(response.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Ensembl</h1>
          <p className="text-gray-600">Let's get you jamming!</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Create Your Profile</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="musician"
                    checked={formData.role === 'musician'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mr-2"
                  />
                  <span>Musician</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="venue"
                    checked={formData.role === 'venue'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mr-2"
                  />
                  <span>Venue</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.role === 'musician' ? 'Name' : 'Venue Name'} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={formData.role === 'musician' ? 'Your name' : 'Venue name'}
              />
            </div>

            {formData.role === 'musician' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Instrument *
                </label>
                <input
                  type="text"
                  required
                  value={formData.instrument}
                  onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Guitar, Drums, Vocals"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.role === 'musician' ? 'City' : 'Location'} *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={formData.role === 'musician' ? 'e.g., Austin, TX' : 'e.g., 123 Main St, Austin, TX'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 mt-6"
            >
              {loading ? 'Creating account...' : 'Get Started'}
            </button>
          </form>

          <p className="text-center mt-4 text-xs text-gray-500">
            You can add more details to your profile later
          </p>
        </div>
      </div>
    </div>
  )
}
