/**
 * Admin Dashboard
 * Overview of platform analytics and metrics
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await adminApi.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // If unauthorized, redirect to login
      if (error.message.includes('401') || error.message.includes('403')) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Failed to load analytics</div>
      </div>
    )
  }

  const { users, content } = analytics

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-1">Real-time platform analytics and metrics</p>
      </div>

      {/* User Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={users.total}
            icon="👥"
            color="bg-blue-50"
            textColor="text-blue-700"
          />
          <MetricCard
            title="Active Users"
            value={users.active}
            icon="✅"
            color="bg-green-50"
            textColor="text-green-700"
          />
          <MetricCard
            title="Musicians"
            value={users.musicians}
            icon="🎸"
            color="bg-purple-50"
            textColor="text-purple-700"
          />
          <MetricCard
            title="Venues"
            value={users.venues}
            icon="🏛️"
            color="bg-amber-50"
            textColor="text-amber-700"
          />
        </div>
      </div>

      {/* Content Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Jam Posts"
            value={content.jam_posts}
            icon="📝"
            color="bg-indigo-50"
            textColor="text-indigo-700"
          />
          <MetricCard
            title="Active Ensembles"
            value={content.ensembles}
            icon="🎭"
            color="bg-pink-50"
            textColor="text-pink-700"
          />
          <MetricCard
            title="Total Venues"
            value={content.venues}
            icon="🏢"
            color="bg-teal-50"
            textColor="text-teal-700"
          />
          <MetricCard
            title="Total Gigs"
            value={content.gigs.total}
            icon="🎤"
            color="bg-orange-50"
            textColor="text-orange-700"
          />
        </div>
      </div>

      {/* Gig Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gig Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Open Gigs"
            value={content.gigs.open}
            icon="🔓"
            color="bg-green-50"
            textColor="text-green-700"
          />
          <MetricCard
            title="Completed Gigs"
            value={content.gigs.completed}
            icon="✓"
            color="bg-blue-50"
            textColor="text-blue-700"
          />
          <MetricCard
            title="Completion Rate"
            value={content.gigs.total > 0 
              ? `${Math.round((content.gigs.completed / content.gigs.total) * 100)}%`
              : '0%'}
            icon="📊"
            color="bg-purple-50"
            textColor="text-purple-700"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionButton
            label="Manage Users"
            icon="👥"
            onClick={() => navigate('/admin/users')}
          />
          <QuickActionButton
            label="Manage Venues"
            icon="🏛️"
            onClick={() => navigate('/admin/venues')}
          />
          <QuickActionButton
            label="Manage Ensembles"
            icon="🎭"
            onClick={() => navigate('/admin/ensembles')}
          />
          <QuickActionButton
            label="Manage Gigs"
            icon="🎤"
            onClick={() => navigate('/admin/gigs')}
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color, textColor }) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
      </div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
    </div>
  )
}

function QuickActionButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </button>
  )
}
