'use client'

import { useState } from 'react'
import { useUser } from './UserIdentityProvider'

export function JoinBanner() {
  const { user, isLoading } = useUser()
  const [handle, setHandle] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showTwitter, setShowTwitter] = useState(false)
  const { claimHandle } = useUser()

  // Don't show if loading or already signed in
  if (isLoading || user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = handle.trim()
    if (!trimmed) return

    if (trimmed.length < 3) {
      setError('Handle must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Letters, numbers, and underscores only')
      return
    }

    setSubmitting(true)
    const result = await claimHandle(trimmed, twitterHandle.trim() || undefined)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error || 'Something went wrong')
    }
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">Join the crew</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pick a handle to track your progress and show up on the board
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value)
                  setError('')
                }}
                placeholder="your_handle"
                maxLength={20}
                className="pl-7 pr-3 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm w-40"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !handle.trim()}
              className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {submitting ? 'Joining...' : 'Join'}
            </button>
          </div>

          {!showTwitter && (
            <button
              type="button"
              onClick={() => setShowTwitter(true)}
              className="text-violet-600 text-xs hover:text-violet-700 transition-colors text-left"
            >
              + Add your X/Twitter handle (optional)
            </button>
          )}

          {showTwitter && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                @
              </span>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="twitter_handle"
                maxLength={15}
                className="pl-7 pr-3 py-1.5 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xs w-full"
                disabled={submitting}
              />
            </div>
          )}

          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
