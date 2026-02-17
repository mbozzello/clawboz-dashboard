'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MissionCompleters } from '@/components/MissionCompleters'
import { MissionComments } from '@/components/MissionComments'
import { VoteButtons } from '@/components/VoteButtons'
import { JargonText } from '@/components/JargonText'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MissionPageClient({ date }: { date: string }) {
  const [detail, setDetail] = useState<MissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMission, setSelectedMission] = useState(0)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [completers, setCompleters] = useState<Record<number, Completer[]>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/missions/${date}`)
        if (!res.ok) {
          setError('Skill not found')
          return
        }
        const data: MissionDetail = await res.json()
        setDetail(data)

        // Fetch completers
        const result: Record<number, Completer[]> = {}
        for (let i = 0; i < data.missions.length; i++) {
          try {
            const cRes = await fetch(`/api/completions?date=${date}&idx=${i}`)
            const cData = await cRes.json()
            result[i] = cData.completers || []
          } catch {
            result[i] = []
          }
        }
        setCompleters(result)
      } catch {
        setError('Failed to load skill')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [date])

  const difficultyColor = (d: string) => {
    if (d.toLowerCase().includes('beginner')) return 'bg-green-100 text-green-800'
    if (d.toLowerCase().includes('advanced')) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading skill...
        </div>
      </main>
    )
  }

  if (error || !detail) {
    return (
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">{error || 'Skill not found'}</p>
            <Link href="/" className="text-violet-600 hover:text-violet-700 text-sm mt-4 inline-block">
              ← Back to Skills
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const mission = detail.missions[selectedMission]
  if (!mission) return null

  const currentCompleters = completers[selectedMission] || []

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <header>
          <Link href="/" className="text-violet-600 hover:text-violet-700 text-sm mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Skills
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Skills — {date}</h1>
        </header>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Skill tabs */}
          <div className="border-b border-gray-200 px-4">
            <div className="flex gap-1 overflow-x-auto -mb-px">
              {detail.missions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedMission(idx); setExpandedStep(null) }}
                  className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedMission === idx
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Skill {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Skill content */}
          <div>
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

              {/* End Result */}
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
              <VoteButtons date={date} missionIdx={selectedMission} />
            </div>

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
            <MissionComments date={date} missionIdx={selectedMission} />
          </div>
        </div>
      </div>
    </main>
  )
}
