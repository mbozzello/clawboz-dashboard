'use client'

import { useState } from 'react'
import { MissionHub } from '@/components/MissionHub'
import { RepositoryHub } from '@/components/RepositoryHub'
import { CommunityHeader } from '@/components/CommunityHeader'

type TopTab = 'skills' | 'repository'

export default function Home() {
  const [tab, setTab] = useState<TopTab>('skills')

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <CommunityHeader />

        {/* Top-level tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {([
            { key: 'skills' as TopTab, label: 'Skills' },
            { key: 'repository' as TopTab, label: 'Repository' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'skills' ? <MissionHub /> : <RepositoryHub />}
      </div>
    </main>
  )
}
