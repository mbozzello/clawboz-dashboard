'use client'

import { useState, useEffect } from 'react'

/** Gets (or creates) a stable anonymous voter ID stored in localStorage */
function getVoterId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const key = 'clawboz-voter-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

interface StarRatingProps {
  date: string
  missionIdx: number
}

export function StarRating({ date, missionIdx }: StarRatingProps) {
  const [avg, setAvg] = useState(0)
  const [count, setCount] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchRating() {
      try {
        const res = await fetch(`/api/ratings?date=${date}&idx=${missionIdx}`)
        if (res.ok) {
          const data = await res.json()
          setAvg(data.avg || 0)
          setCount(data.count || 0)
          // Check if this voter already rated (stored locally)
          const stored = localStorage.getItem(`rating-${date}-${missionIdx}`)
          if (stored) setUserRating(Number(stored))
        }
      } catch {
        // Rating system not available yet
      }
    }
    fetchRating()
  }, [date, missionIdx])

  async function handleRate(stars: number) {
    if (submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const voterId = getVoterId()
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, missionIdx, stars, voterId }),
      })
      const data = await res.json()
      if (res.ok) {
        setAvg(data.avg || 0)
        setCount(data.count || 0)
        setUserRating(stars)
        localStorage.setItem(`rating-${date}-${missionIdx}`, String(stars))
      } else {
        setMessage(data.error || 'Could not save rating')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setMessage('Could not save rating — try again')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const displayStars = hoveredStar ?? userRating ?? 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            disabled={submitting}
            className={`text-lg transition-transform hover:scale-110 cursor-pointer ${
              submitting ? 'opacity-50' : ''
            }`}
            title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <span className={star <= displayStars ? 'text-amber-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-gray-500">
          {avg.toFixed(1)} ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      )}
      {userRating && !message && (
        <span className="text-xs text-violet-600 font-medium">Your rating: {userRating}★</span>
      )}
      {message && (
        <span className="text-xs text-amber-600 font-medium">{message}</span>
      )}
    </div>
  )
}
