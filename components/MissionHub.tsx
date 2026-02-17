'use client'

import { useState, useEffect, useCallback } from 'react'
import { MissionCompleters } from './MissionCompleters'
import { MissionComments } from './MissionComments'
import { VoteButtons } from './VoteButtons'
import { JargonText } from './JargonText'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MissionListItem {
  date: string
  lessonCount: number
  titles: string[]
  descriptions: string[]
}

/** Flat individual skill row for the list view */
interface SkillRow {
  date: string
  missionIdx: number
  title: string
  description: string
  /** net vote score cached from API for Popular sort */
  net: number
}

interface ParsedStep {
  number: number
  title: string
  description: string
  commands: string[]
  checklist: string[]
}

interface ParsedMission {
  index: number
  title: string
  timeEstimate: string
  difficulty: string
  tools: string
  description: string
  youllBuild: string[]
  prerequisites: string[]
  steps: ParsedStep[]
  successCriteria: string[]
  nextSteps: string[]
}

interface MissionDetail {
  date: string
  missions: ParsedMission[]
}

interface Completer {
  handle: string
  proof: string
  completedAt: string
}

type View = 'list' | 'detail'
type SortTab = 'latest' | 'popular'

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MissionHub() {
  // raw data from API
  const [missionList, setMissionList] = useState<MissionListItem[]>([])
  const [detail, setDetail] = useState<MissionDetail | null>(null)
  const [skillRows, setSkillRows] = useState<SkillRow[]>([])

  // ui
  const [view, setView] = useState<View>('list')
  const [sortTab, setSortTab] = useState<SortTab>('latest')
  const [selectedMission, setSelectedMission] = useState(0)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  // completers per mission (detail view)
  const [completers, setCompleters] = useState<Record<number, Completer[]>>({})

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
            title: m.titles[i] || `Skill ${i + 1}`,
            description: m.descriptions[i] || '',
            net: 0,
          })
        }
      }
      setSkillRows(rows)

      // Fetch vote scores for all skills so Popular sort works
      // Use concurrent fetches with a small batch size to avoid rate limits
      const updated = [...rows]
      await Promise.all(
        rows.map(async (row, rowIdx) => {
          try {
            const r = await fetch(`/api/votes?date=${row.date}&idx=${row.missionIdx}`)
            if (r.ok) {
              const d = await r.json()
              updated[rowIdx] = { ...updated[rowIdx], net: d.net || 0 }
            }
          } catch {
            // vote scores unavailable for this skill
          }
        })
      )
      setSkillRows(updated)
    } catch (e) {
      console.error('Failed to fetch skill list', e)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  /* ---------- load detail ---------- */

  const loadSkill = async (date: string, missionIdx: number) => {
    try {
      const res = await fetch(`/api/missions/${date}`)
      const data: MissionDetail = await res.json()
      setDetail(data)
      setSelectedMission(missionIdx)
      setExpandedStep(null)
      setView('detail')
      fetchCompleters(date, data.missions.length)
    } catch (e) {
      console.error('Failed to load skill', e)
    }
  }

  /* ---------- fetch completers ---------- */

  const fetchCompleters = async (date: string, count: number) => {
    const result: Record<number, Completer[]> = {}
    for (let i = 0; i < count; i++) {
      try {
        const res = await fetch(`/api/completions?date=${date}&idx=${i}`)
        const data = await res.json()
        result[i] = data.completers || []
      } catch {
        result[i] = []
      }
    }
    setCompleters(result)
  }

  /* ---------- helpers ---------- */

  const difficultyColor = (d: string) => {
    if (d.toLowerCase().includes('beginner')) return 'bg-green-100 text-green-800'
    if (d.toLowerCase().includes('advanced')) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  /* ---------- derived flat list ---------- */

  const filteredRows = (() => {
    let rows = search.trim()
      ? skillRows.filter(row => {
          const q = search.toLowerCase()
          return (
            row.date.includes(q) ||
            row.title.toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q)
          )
        })
      : [...skillRows]

    if (sortTab === 'popular') {
      rows = rows.slice().sort((a, b) => b.net - a.net)
    }
    // latest = already in reverse-chron order from API
    return rows
  })()

  /* ------------------------------------------------------------------ */
  /* RENDER — list view                                                  */
  /* ------------------------------------------------------------------ */

  if (view === 'list') {
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
          {/* Loading skeleton */}
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

              {/* Skill info — clickable */}
              <button
                onClick={() => loadSkill(row.date, row.missionIdx)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                    {row.title}
                  </span>
                </div>
                {row.description && (
                  <p className="text-xs text-gray-500 leading-relaxed truncate">{row.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{row.date}</p>
              </button>

              {/* Chevron */}
              <button
                onClick={() => loadSkill(row.date, row.missionIdx)}
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

  /* ------------------------------------------------------------------ */
  /* RENDER — detail view                                                */
  /* ------------------------------------------------------------------ */

  if (!detail || detail.missions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading skill...
        </div>
      </div>
    )
  }

  const mission = detail.missions[selectedMission]
  if (!mission) return null

  const currentCompleters = completers[selectedMission] || []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => setView('list')}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Skills
        </button>
        <span className="text-sm text-gray-500">{detail.date}</span>
      </div>

      {/* Skill content */}
      <div className="max-h-[700px] overflow-y-auto mission-scroll">
        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{mission.title}</h3>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {mission.timeEstimate && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                {mission.timeEstimate}
              </span>
            )}
            {mission.difficulty && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor(mission.difficulty)}`}>
                {mission.difficulty}
              </span>
            )}
            {mission.tools && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
                <JargonText text={mission.tools} />
              </span>
            )}
          </div>

          {mission.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              <JargonText text={mission.description} />
            </p>
          )}

          {/* End Result — the concrete payoff */}
          {mission.youllBuild.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Result</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {mission.youllBuild.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-800"><JargonText text={item} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vote buttons */}
          <VoteButtons date={detail.date} missionIdx={selectedMission} />
        </div>

        {/* Completers */}
        <MissionCompleters completers={currentCompleters} />

        {/* Prerequisites */}
        {mission.prerequisites.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Prerequisites</h4>
              <ul className="space-y-1">
                {mission.prerequisites.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500 flex-shrink-0">•</span>
                    <JargonText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Steps — read-only accordion */}
        <div className="px-6 pb-2">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Steps</h4>
        </div>

        <div className="px-6 pb-4 space-y-2">
          {mission.steps.map((step, stepIdx) => {
            const isOpen = expandedStep === stepIdx

            return (
              <div key={stepIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStep(isOpen ? null : stepIdx)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-100 text-gray-600">
                      {step.number}
                    </span>
                    <div>
                      <span className="font-medium text-sm text-gray-900">
                        <JargonText text={step.title} />
                      </span>
                      {step.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <JargonText text={step.description} />
                        </p>
                      )}
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 px-4 py-4 space-y-4 accordion-content">
                    {step.commands.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commands</span>
                          <button
                            onClick={() => {
                              const text = step.commands.filter(c => !c.startsWith('#')).join('\n')
                              navigator.clipboard.writeText(text)
                            }}
                            className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                          >
                            Copy commands
                          </button>
                        </div>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
                          <pre className="text-[13px] font-mono whitespace-pre-wrap leading-relaxed">{step.commands.join('\n')}</pre>
                        </div>
                      </div>
                    )}

                    {step.checklist.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checklist</span>
                        <ul className="mt-2 space-y-1.5">
                          {step.checklist.map((item, ci) => (
                            <li key={ci} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                              <JargonText text={item} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Success criteria — read-only */}
        {mission.successCriteria.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Success Criteria</h4>
              <ul className="space-y-1.5">
                {mission.successCriteria.map((item, ci) => (
                  <li key={ci} className="flex items-start gap-2 text-sm text-emerald-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <JargonText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Discussion */}
        <MissionComments date={detail.date} missionIdx={selectedMission} />
      </div>
    </div>
  )
}
