/**
 * Ensemble Application Card Component
 * * Phase 2: Venue Confidence & Booking Readiness
 * Displays ensemble application with credibility signals for quick venue decision-making
 * * Shows:
 * - Ensemble name and member count
 * - Instruments represented
 * - Verified gig count (trust signal)
 * - Combined bio snippet
 * - Media preview if available
 * - Accept/Reject actions
 */

import { useState } from 'react'

export default function EnsembleApplicationCard({ application, onAccept, onReject }) {
  const [loading, setLoading] = useState(false)

  // --- SAFETY CHECK: Prevent crash if data is missing ---
  if (!application || !application.ensemble) {
      return null;
  }

  const ensemble = application.ensemble

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept(application.id)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await onReject(application.id)
    } finally {
      setLoading(false)
    }
  }

  // Extract instruments from members (Safely)
  const instruments = ensemble.members
    ? [...new Set(ensemble.members.map(m => m.instrument).filter(Boolean))]
    : []

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 card-hover-lift transition animate-fade-in">
      {/* Header: Name and Verified Count */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{ensemble.name}</h3>
          <p className="text-sm text-gray-600">
            {ensemble.members?.length || 0} member{ensemble.members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Credibility Signal: Verified Gig Count */}
        <div className="bg-indigo-50 rounded-lg px-4 py-2 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {ensemble.verified_gig_count || 0}
          </div>
          <div className="text-xs text-indigo-700 font-medium">
            Verified Gigs
          </div>
        </div>
      </div>

      {/* Instruments Tag Line */}
      {instruments.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {instruments.map((instrument, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
              >
                🎵 {instrument}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Combined Bio Snippet */}
      {ensemble.combined_bio && (
        <div className="mb-4">
          <p className="text-gray-700 line-clamp-3">
            {ensemble.combined_bio}
          </p>
        </div>
      )}

      {/* Media Preview (if available) */}
      {ensemble.combined_media && (
        <div className="mb-4">
          <a
            href={ensemble.combined_media}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            🎧 Listen to their music
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Member List (Safely Rendered) */}
      {ensemble.members && ensemble.members.length > 0 && (
        <div className="mb-4 border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Band Members:</p>
          <div className="space-y-1">
            {ensemble.members.map((member, idx) => (
              <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                <span className="font-medium">{member.name}</span>
                {member.instrument && (
                  <span className="text-gray-500">• {member.instrument}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Status */}
      <div className="mb-4">
        <div className="text-xs text-gray-500">
          Applied {new Date(application.applied_at).toLocaleDateString()}
        </div>
      </div>

      {/* Actions: Accept / Reject */}
      {application.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed button-press"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm button-press"
          >
            Accept & Start Chat
          </button>
        </div>
      )}

      {/* Status Badge for Accepted */}
      {application.status === 'accepted' && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
          <span className="text-green-700 font-medium">✓ Accepted</span>
        </div>
      )}

      {/* Status Badge for Rejected */}
      {application.status === 'rejected' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
          <span className="text-gray-600 font-medium">Declined</span>
        </div>
      )}
    </div>
  )
}