import { fetchEvents } from '@/lib/api'
import { Dashboard } from '@/components/Dashboard'
import { MissionHub } from '@/components/MissionHub'

export const revalidate = 0

export default async function Home() {
  const events = await fetchEvents()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ClawBoz HQ Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of agents and projects
          </p>
        </div>

        {/* Mission Hub — full mission management */}
        <div className="mb-8">
          <MissionHub />
        </div>

        {/* Activity Dashboard */}
        <Dashboard events={events} />
      </div>
    </main>
  )
}
