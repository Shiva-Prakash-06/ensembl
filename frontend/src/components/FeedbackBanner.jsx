/**
 * Feedback Banner Component
 * 
 * Phase 3: Awareness, Feedback & Emotional UX
 * Contextual inline banners to replace generic alerts
 * 
 * Types:
 * - success (green)
 * - info (blue/purple)
 * - warning (amber)
 * - error (red)
 * 
 * Features:
 * - Dismissible
 * - Auto-hide on navigation
 * - Smooth animations
 */

import { useState, useEffect } from 'react'

export default function FeedbackBanner({ 
  type = 'info', 
  message, 
  icon,
  isVisible = true,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000 
}) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (autoDismiss && show) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, show, autoDismissDelay])

  const handleDismiss = () => {
    setShow(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  const getStyles = () => {
    const styles = {
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: icon || '✓',
        iconBg: 'bg-green-100 text-green-600'
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: icon || 'ℹ',
        iconBg: 'bg-blue-100 text-blue-600'
      },
      warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: icon || '⚠',
        iconBg: 'bg-amber-100 text-amber-600'
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: icon || '✕',
        iconBg: 'bg-red-100 text-red-600'
      }
    }
    return styles[type] || styles.info
  }

  if (!show) return null

  const style = getStyles()

  return (
    <div 
      className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4 transition-all duration-300 ease-in-out animate-fade-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${style.text} text-sm font-medium`}>
            {message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className={`${style.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 ml-2`}
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * Hook for managing banner state
 * Usage:
 * const { banner, showBanner, hideBanner } = useFeedbackBanner()
 * showBanner('success', 'Operation successful!')
 * return <>{banner}</>
 */
export function useFeedbackBanner() {
  const [bannerState, setBannerState] = useState({
    isVisible: false,
    type: 'info',
    message: '',
    icon: null
  })

  const showBanner = (type, message, icon = null, autoDismiss = true) => {
    setBannerState({
      isVisible: true,
      type,
      message,
      icon
    })

    if (autoDismiss) {
      setTimeout(() => {
        hideBanner()
      }, 5000)
    }
  }

  const hideBanner = () => {
    setBannerState(prev => ({ ...prev, isVisible: false }))
  }

  const banner = bannerState.isVisible ? (
    <FeedbackBanner
      type={bannerState.type}
      message={bannerState.message}
      icon={bannerState.icon}
      isVisible={bannerState.isVisible}
      onDismiss={hideBanner}
    />
  ) : null

  return { banner, showBanner, hideBanner, bannerState }
}
