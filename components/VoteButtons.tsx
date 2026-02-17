'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface VoteStats {
  up: number
  down: number
  net: number
  userVote: 1 | -1 | 0
}

interface VoteButtonsProps {
  date: string
  missionIdx: number
  /** compact = smaller buttons for list rows; default = full size for detail view */
  compact?: boolean
}

function getVoterId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('launchpad-voter-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('launchpad-voter-id', id)
  }
  return id
}

export function VoteButtons({ date, missionIdx, compact = false }: VoteButtonsProps) {
  const [stats, setStats] = useState<VoteStats>({ up: 0, down: 0, net: 0, userVote: 0 })
  const [loading, setLoading] = useState(true)
  // Mirror of stats in a ref so vote() can read current value synchronously
  const statsRef = useRef<VoteStats>({ up: 0, down: 0, net: 0, userVote: 0 })
  // Prevent concurrent requests — one at a time
  const inFlight = useRef(false)

  // Keep ref in sync with state (ref is only read inside async vote(), never during render)
  useEffect(() => { statsRef.current = stats }, [stats])

  const fetchVotes = useCallback(async () => {
    try {
      const voterId = getVoterId()
      const res = await fetch(
        `/api/votes?date=${encodeURIComponent(date)}&idx=${missionIdx}&voterId=${encodeURIComponent(voterId)}`
      )
      if (res.ok) {
        const data: VoteStats = await res.json()
        setStats(data)
        statsRef.current = data
      }
    } catch {
      // votes unavailable, keep zeros
    } finally {
      setLoading(false)
    }
  }, [date, missionIdx])

  useEffect(() => { fetchVotes() }, [fetchVotes])

  const vote = async (direction: 1 | -1) => {
    // Prevent concurrent requests — one at a time
    if (inFlight.current) return
    inFlight.current = true

    // Capture current state synchronously via ref for rollback
    const prev = statsRef.current
    const isToggleOff = prev.userVote === direction
    const wasOpposite = prev.userVote !== 0 && prev.userVote !== direction

    let nextUp = prev.up
    let nextDown = prev.down
    let nextUserVote: 1 | -1 | 0

    if (isToggleOff) {
      if (direction === 1) nextUp = Math.max(0, nextUp - 1)
      else nextDown = Math.max(0, nextDown - 1)
      nextUserVote = 0
    } else {
      if (direction === 1) {
        nextUp += 1
        if (wasOpposite) nextDown = Math.max(0, nextDown - 1)
      } else {
        nextDown += 1
        if (wasOpposite) nextUp = Math.max(0, nextUp - 1)
      }
      nextUserVote = direction
    }

    const next: VoteStats = { up: nextUp, down: nextDown, net: nextUp - nextDown, userVote: nextUserVote }

    // Apply optimistic update immediately
    setStats(next)
    statsRef.current = next

    try {
      const voterId = getVoterId()
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, missionIdx, direction, voterId }),
      })
      if (res.ok) {
        const data: VoteStats = await res.json()
        setStats(data)
        statsRef.current = data
      }
      // On server error: keep the optimistic state — don't roll back to zeros
      // The server will self-correct next time the component mounts
    } catch {
      // Network error: keep optimistic state, don't roll back
    } finally {
      inFlight.current = false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1 opacity-40">
        <div className={`rounded bg-gray-100 animate-pulse ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
        <div className={`rounded bg-gray-100 animate-pulse ${compact ? 'w-5 h-4' : 'w-6 h-5'}`} />
        <div className={`rounded bg-gray-100 animate-pulse ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
      </div>
    )
  }

  const upActive = stats.userVote === 1
  const downActive = stats.userVote === -1

  if (compact) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => vote(1)}
          title="Upvote"
          className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
            upActive
              ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
              : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l8 8H4l8-8z" />
          </svg>
        </button>
        <span className={`text-xs font-mono font-semibold tabular-nums w-5 text-center ${
          stats.net > 0 ? 'text-violet-600' : stats.net < 0 ? 'text-red-500' : 'text-gray-400'
        }`}>
          {stats.net > 0 ? `+${stats.net}` : stats.net}
        </span>
        <button
          onClick={() => vote(-1)}
          title="Downvote"
          className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
            downActive
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20l-8-8h16l-8 8z" />
          </svg>
        </button>
      </div>
    )
  }

  // Full size (detail view)
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => vote(1)}
        title="Upvote"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          upActive
            ? 'text-violet-700 bg-violet-100 hover:bg-violet-200'
            : 'text-gray-500 bg-gray-100 hover:text-violet-600 hover:bg-violet-50'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l8 8H4l8-8z" />
        </svg>
        <span>{stats.up}</span>
      </button>

      <span className={`text-sm font-semibold tabular-nums ${
        stats.net > 0 ? 'text-violet-600' : stats.net < 0 ? 'text-red-500' : 'text-gray-400'
      }`}>
        {stats.net > 0 ? `+${stats.net}` : stats.net}
      </span>

      <button
        onClick={() => vote(-1)}
        title="Downvote"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          downActive
            ? 'text-red-600 bg-red-100 hover:bg-red-200'
            : 'text-gray-500 bg-gray-100 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l-8-8h16l-8 8z" />
        </svg>
        <span>{stats.down}</span>
      </button>
    </div>
  )
}
