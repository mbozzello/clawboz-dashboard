'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TopMission {
  date: string
  missionIdx: number
  avg: number
  count: number
  title?: string
}

export function TopRatedMissions() {
  const [missions, setMissions] = useState<TopMission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopRated() {
      try {
        const res = await fetch('/api/ratings?top=true&limit=5')
        const data = await res.json()
        const topMissions: TopMission[] = data.missions || []

        // Fetch titles for each mission
        const withTitles = await Promise.all(
          topMissions.map(async (m) => {
            try {
              const mRes = await fetch(`/api/missions/${m.date}`)
              const mData = await mRes.json()
              const mission = mData.missions?.[m.missionIdx]
              return { ...m, title: mission?.title || `Mission ${m.missionIdx + 1}` }
            } catch {
              return { ...m, title: `Mission ${m.missionIdx + 1}` }
            }
          })
        )

        setMissions(withTitles)
      } catch {
        // Ratings not available
      } finally {
        setLoading(false)
      }
    }
    fetchTopRated()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (missions.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Top Rated Missions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Community favorites</p>
      </div>

      <div className="divide-y divide-gray-100">
        {missions.map((m, idx) => (
          <Link
            key={`${m.date}-${m.missionIdx}`}
            href={`/missions/${m.date}`}
            className="block px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-400">#{idx + 1}</span>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {m.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-400">{m.date}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${star <= Math.round(m.avg) ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-600">{m.avg.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({m.count})</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
