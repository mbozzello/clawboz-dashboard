'use client'

import { useState } from 'react'
import { VoteButtons } from './VoteButtons'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface RepoTool {
  id: string
  name: string
  url: string
  description: string
  howToUse: string[]
  tags: string[]
}

const TOOLS: RepoTool[] = [
  {
    id: 'napkin',
    name: 'Napkin',
    url: 'https://github.com/blader/napkin',
    description:
      'Gives your AI assistant a memory. It tracks mistakes and lessons across sessions so Claude Code gets smarter the more you use it.',
    howToUse: [
      'Open your terminal and run: git clone https://github.com/blader/napkin ~/.claude/skills/napkin',
      'Start a new Claude Code session in any project — it automatically reads the napkin',
      'As you work, Claude logs mistakes and lessons to .claude/napkin.md — by session 3-5 it stops repeating errors',
    ],
    tags: ['AI', 'Claude Code', 'Memory'],
  },
]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function RepositoryHub() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Repository</h2>
        <span className="text-xs text-gray-400">{TOOLS.length} tool{TOOLS.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tool list */}
      <div className="divide-y divide-gray-100">
        {TOOLS.map((tool) => {
          const isExpanded = expandedId === tool.id

          return (
            <div key={tool.id}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
                {/* Vote buttons */}
                <div className="flex-shrink-0">
                  <VoteButtons toolId={tool.id} compact />
                </div>

                {/* Tool info — clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tool.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-gray-900 group-hover:text-violet-700 transition-colors">
                      {tool.name}
                    </span>
                    <div className="flex gap-1">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
                </button>

                {/* External link */}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-gray-300 hover:text-violet-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="Open on GitHub"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Chevron */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tool.id)}
                  className="flex-shrink-0"
                  aria-label="Expand tool details"
                >
                  <svg
                    className={`w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-all ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 space-y-4">
                  {/* Description + link */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-500 hover:text-violet-600 transition-colors"
                      >
                        View on GitHub ↗
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
                  </div>

                  {/* How to use */}
                  <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        How to use
                      </span>
                    </div>
                    <ol className="divide-y divide-gray-100">
                      {tool.howToUse.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-3">
                          <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Full-size vote buttons */}
                  <VoteButtons toolId={tool.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {TOOLS.length === 0 && (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No tools yet</p>
          <p className="text-xs text-gray-500 mt-1">Curated tools will appear here soon.</p>
        </div>
      )}
    </div>
  )
}
