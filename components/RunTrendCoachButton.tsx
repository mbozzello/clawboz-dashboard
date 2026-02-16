'use client'

import { useState } from 'react'

export function RunTrendCoachButton() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')

  const runTrendCoach = async () => {
    setIsRunning(true)
    setStatus('running')

    try {
      const response = await fetch('/api/run-trend-coach', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        // Refresh page after 3 seconds to show new events
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error running Trend Coach:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setTimeout(() => setIsRunning(false), 3000)
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'running':
        return 'Running...'
      case 'success':
        return 'Started! Refreshing...'
      case 'error':
        return 'Error - Try Again'
      default:
        return '🎯 Run Trend Coach'
    }
  }

  const getButtonColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-red-600 hover:bg-red-700'
      default:
        return 'bg-purple-600 hover:bg-purple-700'
    }
  }

  return (
    <button
      onClick={runTrendCoach}
      disabled={isRunning}
      className={`${getButtonColor()} text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
    >
      {status === 'running' && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {getButtonText()}
    </button>
  )
}
