/**
 * Jam Board Page (Homepage)
 * Feed of "Looking For" posts
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import JamPostCard from '../components/JamPostCard'
import CreateJamPostModal from '../components/CreateJamPostModal'

export default function JamBoard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect venue users to their dashboard
  useEffect(() => {
    if (user?.role === 'venue') {
      navigate('/venue-dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await api.getJamPosts()
      setPosts(data.posts)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (postData) => {
    try {
      await api.createJamPost(postData)
      setIsModalOpen(false)
      loadPosts() // Reload posts
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const handleMessage = (userId) => {
    navigate(`/chat/${userId}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jam Board</h1>
          <p className="text-gray-600 mt-1">Find musicians to jam with</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Create Post
        </button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No posts yet. Be the first to post!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Create a post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <JamPostCard
              key={post.id}
              post={post}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreateJamPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
        userId={user?.id}
      />
    </div>
  )
}
