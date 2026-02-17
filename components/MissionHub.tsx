'use client'

import { useState, useEffect, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MissionListItem {
  date: string
  lessonCount: number
  titles: string[]
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

interface ProgressData {
  checks: Record<string, boolean> // key = "missionIdx-stepIdx-checkIdx" or "missionIdx-criteria-checkIdx"
  notes: Record<string, string>   // key = "missionIdx"
}

/* ------------------------------------------------------------------ */
/* View enum                                                           */
/* ------------------------------------------------------------------ */

type View = 'list' | 'detail'

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MissionHub() {
  // data
  const [missionList, setMissionList] = useState<MissionListItem[]>([])
  const [detail, setDetail] = useState<MissionDetail | null>(null)

  // ui
  const [view, setView] = useState<View>('list')
  const [selectedMission, setSelectedMission] = useState(0)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  // generator
  const [generating, setGenerating] = useState(false)
  const [genOutput, setGenOutput] = useState('')

  // progress (per date)
  const [progress, setProgress] = useState<ProgressData>({ checks: {}, notes: {} })

  /* ---------- fetch list ---------- */

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch('/api/missions')
      const data = await res.json()
      setMissionList(data.missions || [])
    } catch (e) {
      console.error('Failed to fetch mission list', e)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  /* ---------- load detail ---------- */

  const loadMission = async (date: string) => {
    try {
      const res = await fetch(`/api/missions/${date}`)
      const data: MissionDetail = await res.json()
      setDetail(data)
      setSelectedMission(0)
      setExpandedStep(null)
      setView('detail')

      // load progress from localStorage
      const saved = localStorage.getItem(`mission-hub-${date}`)
      if (saved) {
        setProgress(JSON.parse(saved))
      } else {
        setProgress({ checks: {}, notes: {} })
      }
    } catch (e) {
      console.error('Failed to load mission', e)
    }
  }

  /* ---------- save progress ---------- */

  useEffect(() => {
    if (detail) {
      localStorage.setItem(`mission-hub-${detail.date}`, JSON.stringify(progress))
    }
  }, [progress, detail])

  /* ---------- toggle check ---------- */

  const toggleCheck = (key: string) => {
    setProgress(prev => ({
      ...prev,
      checks: { ...prev.checks, [key]: !prev.checks[key] }
    }))
  }

  const updateNote = (missionIdx: number, text: string) => {
    setProgress(prev => ({
      ...prev,
      notes: { ...prev.notes, [String(missionIdx)]: text }
    }))
  }

  /* ---------- generate ---------- */

  const generate = async () => {
    setGenerating(true)
    setGenOutput('')
    try {
      const res = await fetch('/api/missions/generate', { method: 'POST' })
      const data = await res.json()
      setGenOutput(data.output || data.errors || 'Done')

      if (data.errors && !data.success) {
        // Show error but don't try to reload missions
        return
      }

      await fetchList()

      // auto-open the newest mission
      if (data.success) {
        const listRes = await fetch('/api/missions')
        const listData = await listRes.json()
        if (listData.missions?.length > 0) {
          await loadMission(listData.missions[0].date)
        }
      }
    } catch (e) {
      setGenOutput('Error: ' + String(e))
    } finally {
      setGenerating(false)
    }
  }

  /* ---------- helpers ---------- */

  const getProgressForDate = (date: string): number => {
    const saved = localStorage.getItem(`mission-hub-${date}`)
    if (!saved) return 0
    const p: ProgressData = JSON.parse(saved)
    const total = Object.keys(p.checks).length
    if (total === 0) return 0
    const done = Object.values(p.checks).filter(Boolean).length
    return Math.round((done / total) * 100)
  }

  const getCurrentProgress = (): number => {
    const total = Object.keys(progress.checks).length
    if (total === 0) return 0
    const done = Object.values(progress.checks).filter(Boolean).length
    return Math.round((done / total) * 100)
  }

  const difficultyColor = (d: string) => {
    if (d.toLowerCase().includes('beginner')) return 'bg-green-100 text-green-800'
    if (d.toLowerCase().includes('advanced')) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  /* ------------------------------------------------------------------ */
  /* RENDER — list view                                                  */
  /* ------------------------------------------------------------------ */

  if (view === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🎯 Mission Control</h2>
              <p className="text-purple-200 text-sm mt-1">
                {missionList.length} mission pack{missionList.length !== 1 ? 's' : ''} generated
              </p>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 border border-white/25"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>🚀 Generate New Missions</>
              )}
            </button>
          </div>
        </div>

        {/* Generator output */}
        {genOutput && (
          <div className="border-b border-gray-200 bg-gray-900 text-gray-100 px-6 py-3 max-h-48 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">{genOutput}</pre>
          </div>
        )}

        {/* Mission list */}
        <div className="divide-y divide-gray-100">
          {missionList.length === 0 && !generating && (
            <div className="px-6 py-16 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-500 font-medium">No missions yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Generate New Missions" to get started</p>
            </div>
          )}

          {missionList.map((m) => {
            const pct = getProgressForDate(m.date)
            return (
              <button
                key={m.date}
                onClick={() => loadMission(m.date)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{m.date}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {m.lessonCount} mission{m.lessonCount !== 1 ? 's' : ''}
                      </span>
                      {pct === 100 && <span className="text-xs">✅ Complete</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.titles.map((t, idx) => (
                        <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[260px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    {pct > 0 && pct < 100 && (
                      <div className="w-20">
                        <div className="text-xs text-gray-500 text-right mb-1">{pct}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* RENDER — detail view                                                */
  /* ------------------------------------------------------------------ */

  if (!detail || detail.missions.length === 0) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const mission = detail.missions[selectedMission]
  if (!mission) return null

  const overallPct = getCurrentProgress()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Missions
          </button>
          <div className="flex items-center gap-4">
            <span className="text-purple-200 text-sm">{detail.date}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
              </div>
              <span className="text-white font-bold text-sm">{overallPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission tabs */}
      <div className="border-b border-gray-200 px-4 bg-gray-50">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {detail.missions.map((m, idx) => {
            // count completed checks for this mission
            const missionChecks = Object.entries(progress.checks)
              .filter(([k]) => k.startsWith(`${idx}-`))
            const total = missionChecks.length
            const done = missionChecks.filter(([, v]) => v).length
            const isComplete = total > 0 && done === total

            return (
              <button
                key={idx}
                onClick={() => { setSelectedMission(idx); setExpandedStep(null) }}
                className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedMission === idx
                    ? 'border-purple-600 text-purple-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {isComplete && '✅ '}Mission {idx + 1}
                {total > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">({done}/{total})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mission content */}
      <div className="max-h-[700px] overflow-y-auto">
        {/* Mission header */}
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{mission.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {mission.timeEstimate && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                ⏱️ {mission.timeEstimate}
              </span>
            )}
            {mission.difficulty && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor(mission.difficulty)}`}>
                📊 {mission.difficulty}
              </span>
            )}
            {mission.tools && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                🛠️ {mission.tools}
              </span>
            )}
          </div>
          {mission.description && (
            <p className="text-sm text-gray-700">{mission.description}</p>
          )}
        </div>

        {/* What you'll build */}
        {mission.youllBuild.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 What You'll Build</h4>
              <ul className="space-y-1">
                {mission.youllBuild.map((item, i) => (
                  <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="mt-0.5 text-blue-500">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {mission.prerequisites.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2 text-sm">⚡ Prerequisites</h4>
              <ul className="space-y-1">
                {mission.prerequisites.map((item, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Steps — accordion */}
        <div className="px-6 pb-2">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">🚀 Steps — Execute Through Claude Code</h4>
        </div>

        <div className="px-6 pb-4 space-y-2">
          {mission.steps.map((step, stepIdx) => {
            const isOpen = expandedStep === stepIdx
            const stepChecks = step.checklist.map((_, ci) => progress.checks[`${selectedMission}-${stepIdx}-${ci}`] || false)
            const stepDone = stepChecks.length > 0 && stepChecks.every(Boolean)

            return (
              <div key={stepIdx} className={`border rounded-lg overflow-hidden ${stepDone ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                <button
                  onClick={() => setExpandedStep(isOpen ? null : stepIdx)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      stepDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepDone ? '✓' : step.number}
                    </span>
                    <div>
                      <span className="font-medium text-sm text-gray-900">{step.title}</span>
                      {step.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 px-4 py-4 space-y-4">
                    {/* Commands */}
                    {step.commands.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commands</span>
                          <button
                            onClick={() => {
                              const text = step.commands.filter(c => !c.startsWith('#')).join('\n')
                              navigator.clipboard.writeText(text)
                            }}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Copy commands
                          </button>
                        </div>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap">{step.commands.join('\n')}</pre>
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    {step.checklist.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checklist</span>
                        <div className="mt-2 space-y-2">
                          {step.checklist.map((item, ci) => {
                            const key = `${selectedMission}-${stepIdx}-${ci}`
                            const checked = progress.checks[key] || false
                            return (
                              <label key={ci} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCheck(key)}
                                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                />
                                <span className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                  {item}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Success criteria */}
        {mission.successCriteria.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3 text-sm">🎯 Success Criteria</h4>
              <div className="space-y-2">
                {mission.successCriteria.map((item, ci) => {
                  const key = `${selectedMission}-criteria-${ci}`
                  const checked = progress.checks[key] || false
                  return (
                    <label key={ci} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(key)}
                        className="mt-0.5 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <span className={`text-sm ${checked ? 'text-green-400 line-through' : 'text-green-800 group-hover:text-green-900'}`}>
                        {item}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="px-6 pb-4">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">📝 Your Notes</h4>
          <textarea
            value={progress.notes[String(selectedMission)] || ''}
            onChange={(e) => updateNote(selectedMission, e.target.value)}
            placeholder="Take notes as you work through this mission..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-y"
            rows={3}
          />
        </div>

        {/* Next steps */}
        {mission.nextSteps.length > 0 && (
          <div className="px-6 pb-6">
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50">
                🐰 Next Steps (Optional)
              </summary>
              <div className="px-4 py-3 border-t border-gray-200">
                <ul className="space-y-1.5">
                  {mission.nextSteps.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-0.5 text-gray-400">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
