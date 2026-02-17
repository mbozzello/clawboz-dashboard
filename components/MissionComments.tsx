'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { avatarColor } from '@/lib/utils'

interface Comment {
  handle: string
  message: string
  createdAt: string
}

interface MissionCommentsProps {
  date: string
  missionIdx: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const NAME_KEY = 'launchpad-commenter-name'

export function MissionComments({ date, missionIdx }: MissionCommentsProps) {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Persist the commenter's chosen name across visits
  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) setName(saved)
  }, [])

  const swrKey = `/api/comments?date=${date}&idx=${missionIdx}`
  const { data } = useSWR<{ comments: Comment[] }>(
    swrKey,
    fetcher,
    { refreshInterval: 15000 }
  )

  const comments = data?.comments || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError('')

    // Persist name choice
    const displayName = name.trim() || 'anonymous'
    localStorage.setItem(NAME_KEY, displayName)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, missionIdx, message: trimmed, name: displayName }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        setError(responseData.error || 'Failed to post comment')
        return
      }

      setMessage('')
      mutate(swrKey)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pb-6">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            Discussion
            {comments.length > 0 && (
              <span className="text-xs text-gray-400 font-normal">
                ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
              </span>
            )}
          </h4>
        </div>

        {/* Comments list */}
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {comments.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">No comments yet. Start the conversation.</p>
            </div>
          )}

          {comments.map((c, idx) => (
            <div key={idx} className="px-4 py-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full ${avatarColor(c.handle)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}
                >
                  {c.handle.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.handle}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 break-words">{c.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment form — always visible, no login required */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3 bg-gray-50 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={30}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-white flex-shrink-0"
              disabled={submitting}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError('') }}
              placeholder="Share a tip, ask a question…"
              maxLength={500}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-white"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {submitting ? '…' : 'Send'}
            </button>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </form>
      </div>
    </div>
  )
}
