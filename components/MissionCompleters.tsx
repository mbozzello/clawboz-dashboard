'use client'

import { useState } from 'react'
import { avatarColor } from '@/lib/utils'

interface Completer {
  handle: string
  proof: string
  completedAt: string
}

interface MissionCompletersProps {
  completers: Completer[]
}

export function MissionCompleters({ completers }: MissionCompletersProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (completers.length === 0) return null

  return (
    <div className="px-6 pb-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">
          Completed by {completers.length} {completers.length === 1 ? 'person' : 'people'}
        </h4>
        <div className="flex flex-wrap gap-2">
          {completers.map((c, idx) => (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm cursor-default">
                <div
                  className={`w-5 h-5 rounded-full ${avatarColor(c.handle)} flex items-center justify-center text-white text-[10px] font-bold`}
                >
                  {c.handle.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700">@{c.handle}</span>
              </div>

              {/* Tooltip with proof */}
              {hoveredIdx === idx && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50">
                  <div className="bg-gray-900 text-white rounded-lg p-3 shadow-lg text-xs">
                    <p className="font-medium mb-1">@{c.handle}</p>
                    <p className="text-gray-300">{c.proof}</p>
                    <p className="text-gray-500 mt-1 text-[10px]">
                      {new Date(c.completedAt).toLocaleDateString()}
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
