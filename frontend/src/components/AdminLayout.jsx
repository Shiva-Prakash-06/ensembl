/**
 * Admin Layout
 * Common layout for all admin pages with navigation
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    adminApi.clearAdminUser()
    navigate('/admin/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Ensembl Admin</h1>
              <span className="px-2 py-1 bg-red-600 rounded text-xs font-medium">
                INTERNAL
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <NavLink to="/admin/dashboard" active={isActive('/admin/dashboard')}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/admin/users" active={isActive('/admin/users')}>
              👥 Users
            </NavLink>
            <NavLink to="/admin/venues" active={isActive('/admin/venues')}>
              🏛️ Venues
            </NavLink>
            <NavLink to="/admin/ensembles" active={isActive('/admin/ensembles')}>
              🎭 Ensembles
            </NavLink>
            <NavLink to="/admin/gigs" active={isActive('/admin/gigs')}>
              🎤 Gigs
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 text-center">
            Ensembl Admin Panel • Ethical oversight: No private messages, no hard deletes, all actions reversible
          </p>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
        active
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {children}
    </Link>
  )
}
