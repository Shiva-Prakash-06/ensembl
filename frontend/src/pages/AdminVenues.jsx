/**
 * Admin Venues Management
 * View platform venues and their gig activity
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminVenues() {
  const [venues, setVenues] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    loadVenues()
  }, [currentPage])

  const loadVenues = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getVenues(currentPage)
      setVenues(data.venues)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load venues:', error)
      if (error.message.includes('401') || error.message.includes('403')) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
        <p className="text-gray-600 mt-1">View all registered venues and their activity</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading venues...</div>
      ) : venues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No venues found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Gigs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {venues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{venue.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{venue.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{venue.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venue.total_gigs}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {venue.verified_gig_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(venue.created_at).toLocaleDateString()}
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
    </div>
  )
}
