'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MissionCompleters } from '@/components/MissionCompleters'
import { MissionComments } from '@/components/MissionComments'
import { VoteButtons } from '@/components/VoteButtons'
import { JargonText } from '@/components/JargonText'

/* ------------------------------------------------------------------ */
/* Types (mirrors ParsedMission from API)                              */
/* ------------------------------------------------------------------ */

interface ParsedSource {
  label: string
  url: string
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
  slug: string
  timeEstimate: string
  difficulty: string
  tools: string
  description: string
  source: ParsedSource | null
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

export function SkillPageClient({
  detail,
  mission,
}: {
  detail: MissionDetail
  mission: ParsedMission
}) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [completers, setCompleters] = useState<Completer[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCompleters() {
      try {
        const res = await fetch(`/api/completions?date=${detail.date}&idx=${mission.index - 1}`)
        const data = await res.json()
        setCompleters(data.completers || [])
      } catch {
        // completers unavailable
      }
    }
    fetchCompleters()
  }, [detail.date, mission.index])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const difficultyColor = (d: string) => {
    if (d.toLowerCase().includes('beginner')) return 'bg-green-100 text-green-800'
    if (d.toLowerCase().includes('advanced')) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const missionIdx = mission.index - 1 // 0-based for API calls

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back nav */}
        <Link
          href="/"
          className="text-violet-600 hover:text-violet-700 text-sm inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Skills
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Skill content */}
          <div>
            <div className="px-6 pt-6 pb-5">
              {/* Title + action buttons */}
              <div className="flex items-start justify-between gap-4 mb-1">
                <h1 className="text-lg font-semibold text-gray-900">{mission.title}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Copy link */}
                  <button
                    onClick={copyLink}
                    title="Copy shareable link"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy link
                      </>
                    )}
                  </button>

                  {/* Markdown link */}
                  <a
                    href={`/api/skills/${mission.slug}/markdown`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View raw markdown (for AI)"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-mono">MD</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Source link */}
              {mission.source && (
                <p className="text-xs text-gray-400 mb-2">
                  Source:{' '}
                  {mission.source.url ? (
                    <a
                      href={mission.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:text-violet-600 transition-colors"
                    >
                      {mission.source.label} ↗
                    </a>
                  ) : (
                    <span>{mission.source.label}</span>
                  )}
                </p>
              )}

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

              {/* Vote buttons */}
              <VoteButtons date={detail.date} missionIdx={missionIdx} />
            </div>

            <MissionCompleters completers={completers} />

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

            {/* Steps */}
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
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
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

            {/* Success criteria */}
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
            <MissionComments date={detail.date} missionIdx={missionIdx} />
          </div>
        </div>
      </div>
    </main>
  )
}
