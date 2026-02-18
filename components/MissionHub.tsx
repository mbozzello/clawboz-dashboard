'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VoteButtons } from './VoteButtons'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MissionListItem {
  date: string
  lessonCount: number
  titles: string[]
  slugs: string[]
  descriptions: string[]
  difficulties: string[]
  sources: string[]
  sourceUrls: string[]
}

/** Flat individual skill row for the list view */
interface SkillRow {
  date: string
  missionIdx: number
  slug: string
  title: string
  description: string
  difficulty: string
  source: string
  sourceUrl: string
  /** net vote score cached from API for Popular sort */
  net: number
}

type SortTab = 'latest' | 'popular'

const DIFFICULTY_LEVELS = ['All', 'Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'] as const
type DifficultyFilter = typeof DIFFICULTY_LEVELS[number]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MissionHub() {
  const router = useRouter()

  const [missionList, setMissionList] = useState<MissionListItem[]>([])
  const [skillRows, setSkillRows] = useState<SkillRow[]>([])
  const [sortTab, setSortTab] = useState<SortTab>('latest')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All')
  const [search, setSearch] = useState('')

  /* ---------- fetch list + build flat skill rows ---------- */

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch('/api/missions')
      const data = await res.json()
      const missions: MissionListItem[] = data.missions || []
      setMissionList(missions)

      // Build flat skill rows (latest order = as they come from API, newest first)
      const rows: SkillRow[] = []
      for (const m of missions) {
        for (let i = 0; i < m.lessonCount; i++) {
          rows.push({
            date: m.date,
            missionIdx: i,
            slug: m.slugs?.[i] || `${m.date}-skill-${i + 1}`,
            title: m.titles[i] || `Skill ${i + 1}`,
            description: m.descriptions[i] || '',
            difficulty: m.difficulties?.[i] || '',
            source: m.sources?.[i] || '',
            sourceUrl: m.sourceUrls?.[i] || '',
            net: 0,
          })
        }
      }
      setSkillRows(rows)
      refreshVoteScores(rows)
    } catch (e) {
      console.error('Failed to fetch skill list', e)
    }
  }, [])

  // Refresh net vote scores for all skill rows (used on mount + tab switch)
  const refreshVoteScores = useCallback(async (rows?: SkillRow[]) => {
    const source = rows || skillRows
    if (source.length === 0) return
    const updated = [...source]
    await Promise.all(
      source.map(async (row, rowIdx) => {
        try {
          const r = await fetch(`/api/votes?date=${row.date}&idx=${row.missionIdx}`)
          if (r.ok) {
            const d = await r.json()
            updated[rowIdx] = { ...updated[rowIdx], net: d.net || 0 }
          }
        } catch {
          // vote scores unavailable
        }
      })
    )
    setSkillRows(updated)
  }, [skillRows])

  useEffect(() => { fetchList() }, [fetchList])

  // Re-fetch vote scores when switching to Popular
  useEffect(() => {
    if (sortTab === 'popular' && skillRows.length > 0) {
      refreshVoteScores()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortTab])

  /* ---------- derived flat list ---------- */

  const filteredRows = useMemo(() => {
    let rows = [...skillRows]

    // Difficulty filter
    if (difficultyFilter !== 'All') {
      rows = rows.filter(row =>
        row.difficulty.toLowerCase().includes(difficultyFilter.toLowerCase())
      )
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(row =>
        row.date.includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
      )
    }

    if (sortTab === 'popular') {
      rows = rows.slice().sort((a, b) => b.net - a.net)
    }
    return rows
  }, [skillRows, sortTab, difficultyFilter, search])

  /* ------------------------------------------------------------------ */
  /* RENDER                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with Latest / Popular tabs */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Skills</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['latest', 'popular'] as SortTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSortTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                sortTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'latest' ? 'Latest' : '▲ Popular'}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty filter pills */}
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-1.5 flex-wrap">
        {DIFFICULTY_LEVELS.map((level) => {
          const colors: Record<string, string> = {
            All: 'bg-gray-100 text-gray-600',
            Beginner: 'bg-green-100 text-green-700',
            Easy: 'bg-blue-100 text-blue-700',
            Intermediate: 'bg-yellow-100 text-yellow-700',
            Advanced: 'bg-orange-100 text-orange-700',
            Expert: 'bg-red-100 text-red-700',
          }
          const activeColors: Record<string, string> = {
            All: 'bg-gray-800 text-white',
            Beginner: 'bg-green-600 text-white',
            Easy: 'bg-blue-600 text-white',
            Intermediate: 'bg-yellow-500 text-white',
            Advanced: 'bg-orange-500 text-white',
            Expert: 'bg-red-600 text-white',
          }
          const isActive = difficultyFilter === level
          return (
            <button
              key={level}
              onClick={() => setDifficultyFilter(level)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? activeColors[level] : colors[level] + ' hover:opacity-80'
              }`}
            >
              {level}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Flat skill list */}
      <div className="divide-y divide-gray-100">
        {/* Empty state */}
        {missionList.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No skills yet</p>
            <p className="text-xs text-gray-500 mt-1">New skills are added daily — check back soon.</p>
          </div>
        )}

        {missionList.length > 0 && filteredRows.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500">No skills match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="text-xs text-violet-600 hover:text-violet-700 mt-2">
              Clear search
            </button>
          </div>
        )}

        {filteredRows.map((row) => (
          <div
            key={`${row.date}-${row.missionIdx}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
          >
            {/* Vote buttons */}
            <div className="flex-shrink-0">
              <VoteButtons date={row.date} missionIdx={row.missionIdx} compact />
            </div>

            {/* Skill info — navigates to dedicated page */}
            <button
              onClick={() => router.push(`/skills/${row.slug}`)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-medium text-sm text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                  {row.title}
                </span>
                {row.difficulty && (() => {
                  const pill: Record<string, string> = {
                    beginner: 'bg-green-100 text-green-700',
                    easy: 'bg-blue-100 text-blue-700',
                    intermediate: 'bg-yellow-100 text-yellow-700',
                    advanced: 'bg-orange-100 text-orange-700',
                    expert: 'bg-red-100 text-red-700',
                  }
                  const key = Object.keys(pill).find(k => row.difficulty.toLowerCase().includes(k)) || ''
                  return key ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${pill[key]}`}>
                      {row.difficulty}
                    </span>
                  ) : null
                })()}
              </div>
              {row.description && (
                <p className="text-xs text-gray-500 leading-relaxed truncate">{row.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {row.date}
                {row.source && (
                  <span className="ml-1.5 text-gray-300">·</span>
                )}
                {row.source && (
                  row.sourceUrl ? (
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-1.5 text-gray-400 italic hover:text-blue-400 transition-colors"
                    >
                      {row.source}
                    </a>
                  ) : (
                    <span className="ml-1.5 text-gray-400 italic">{row.source}</span>
                  )
                )}
              </p>
            </button>

            {/* Chevron */}
            <button
              onClick={() => router.push(`/skills/${row.slug}`)}
              className="flex-shrink-0"
              aria-label="Open skill"
            >
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
