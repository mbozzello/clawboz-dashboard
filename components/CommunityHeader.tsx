'use client'

import { useState, useEffect } from 'react'

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function calc() {
      const now = new Date()
      const msInDay = 86400000
      const msIn12h = msInDay / 2
      // Drops at 00:00 UTC and 12:00 UTC
      const msSinceMidnightUTC =
        now.getUTCHours() * 3600000 +
        now.getUTCMinutes() * 60000 +
        now.getUTCSeconds() * 1000 +
        now.getUTCMilliseconds()
      const msSinceLastDrop = msSinceMidnightUTC % msIn12h
      const diff = msIn12h - msSinceLastDrop
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  return timeLeft
}

export function CommunityHeader() {
  const timeLeft = useCountdown()

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Launchpad
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hands-on AI skills for product managers
        </p>
      </div>

      {timeLeft && (
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 mb-0.5">Next drop in</span>
          <span className="font-mono text-sm font-semibold text-gray-700 tabular-nums">
            {timeLeft}
          </span>
        </div>
      )}
    </header>
  )
}
