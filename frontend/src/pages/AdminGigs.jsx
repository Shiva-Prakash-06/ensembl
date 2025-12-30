/**
 * Admin Gigs Management
 * View and manage platform gigs
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminGigs() {
  const [gigs, setGigs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmModal, setConfirmModal] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadGigs()
  }, [currentPage, filters])

  const loadGigs = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getGigs(currentPage, filters)
      setGigs(data.gigs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load gigs:', error)
      if (error.message.includes('401') || error.message.includes('403')) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOpen = async (gigId) => {
    try {
      await adminApi.toggleGigOpen(gigId)
      loadGigs()
      setConfirmModal(null)
    } catch (error) {
      console.error('Failed to toggle gig status:', error)
      alert(error.message)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gig Management</h1>
        <p className="text-gray-600 mt-1">View and manage platform gigs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value || undefined })
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Gigs</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({})
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading gigs...</div>
      ) : gigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No gigs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gigs.map((gig) => (
                  <tr key={gig.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{gig.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{gig.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{gig.venue_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(gig.date_time).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {gig.applications}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gig.is_open
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {gig.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setConfirmModal(gig)}
                        className={`px-3 py-1 rounded ${
                          gig.is_open
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } transition text-xs font-medium`}
                      >
                        {gig.is_open ? 'Close' : 'Reopen'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {currentPage} of {pagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Action</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to {confirmModal.is_open ? 'close' : 'reopen'}{' '}
              <strong>{confirmModal.title}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleOpen(confirmModal.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  confirmModal.is_open
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmModal.is_open ? 'Close Gig' : 'Reopen Gig'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
