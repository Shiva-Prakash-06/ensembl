/**
 * Profile Page
 * View and edit musician profile
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import GigHistory from '../components/GigHistory'

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [ensembles, setEnsembles] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)

  const isOwnProfile = currentUser?.id === parseInt(userId)

  useEffect(() => {
    loadProfile()
    if (isOwnProfile) {
      loadEnsembles()
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      const data = await api.getUser(userId)
      setProfile(data)
      setFormData({
        media_embed: data.media_embed || '',
        bio: data.bio || '',
        vibe_tags: data.vibe_tags?.join(', ') || '',
        is_active: data.is_active,
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEnsembles = async () => {
    try {
      const ensemblesData = await api.getUserEnsembles(userId)
      setEnsembles(ensemblesData.ensembles || [])
    } catch (error) {
      console.error('Failed to load ensembles:', error)
    }
  }

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        vibe_tags: formData.vibe_tags, // Keep as comma-separated string
      }
      const response = await api.updateUser(userId, updateData)
      setProfile(response.user)
      if (isOwnProfile) {
        updateUser(response.user)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!profile) {
    return <div className="text-center py-12">Profile not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-3xl">
                {profile.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              {profile.role === 'musician' && profile.instrument && (
                <p className="text-xl text-gray-600">{profile.instrument}</p>
              )}
              <p className="text-gray-500">📍 {profile.city}</p>
              {profile.role === 'venue' && (
                <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Venue
                </span>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>

        {/* Availability Toggle */}
        {isOwnProfile && profile.role === 'musician' && (
          <div className="mb-6 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEditing ? formData.is_active : profile.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                disabled={!isEditing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {(isEditing ? formData.is_active : profile.is_active) ? 'Open to Jam' : 'Not Active'}
              </span>
            </label>
          </div>
        )}

        {/* Media Embed */}
        {profile.role === 'musician' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Media</h3>
            {isEditing ? (
              <input
                type="url"
                value={formData.media_embed}
                onChange={(e) => setFormData({ ...formData, media_embed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="YouTube or SoundCloud link"
              />
            ) : profile.media_embed ? (
              <a 
                href={profile.media_embed} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700"
              >
                {profile.media_embed}
              </a>
            ) : (
              <p className="text-gray-500">No media link added</p>
            )}
          </div>
        )}

        {/* Vibe Tags */}
        {profile.role === 'musician' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Vibe Tags</h3>
            {isEditing ? (
              <input
                type="text"
                value={formData.vibe_tags}
                onChange={(e) => setFormData({ ...formData, vibe_tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Jazz, Experimental, Chill (3-5 tags, comma-separated)"
              />
            ) : profile.vibe_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.vibe_tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No vibe tags added</p>
            )}
          </div>
        )}

        {/* Bio */}
        {profile.role === 'musician' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Bio</h3>
            {isEditing ? (
              <textarea
                rows="4"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tell us about yourself..."
              />
            ) : profile.bio ? (
              <p className="text-gray-700">{profile.bio}</p>
            ) : (
              <p className="text-gray-500">No bio added</p>
            )}
          </div>
        )}

        {/* Save Button */}
        {isEditing && (
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Save Changes
          </button>
        )}

        {/* Ensembles */}
        {profile.role === 'musician' && isOwnProfile && ensembles.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Ensembles</h3>
            <div className="space-y-2">
              {ensembles.map((ens) => (
                <div key={ens.id} className="bg-indigo-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-900">{ens.name}</span>
                    <span className="text-sm text-indigo-600">
                      {ens.members?.length || 0} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gig History - Phase 2 Fix: Real data from /api/history */}
      {profile?.role === 'musician' && isOwnProfile && (
        <div className="mt-6">
          <GigHistory />
        </div>
      )}
    </div>
  )
}
