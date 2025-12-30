/**
 * Admin Ensembles Management
 * View platform ensembles and their activity
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminEnsembles() {
  const [ensembles, setEnsembles] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    loadEnsembles()
  }, [currentPage])

  const loadEnsembles = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getEnsembles(currentPage)
      setEnsembles(data.ensembles)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load ensembles:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Ensemble Management</h1>
        <p className="text-gray-600 mt-1">View all active ensembles</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading ensembles...</div>
      ) : ensembles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No ensembles found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leader</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified Gigs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ensembles.map((ensemble) => (
                  <tr key={ensemble.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{ensemble.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{ensemble.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ensemble.leader_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {ensemble.member_count} members
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {ensemble.verified_gig_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ensemble.created_at).toLocaleDateString()}
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
