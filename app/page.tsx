import { MissionHub } from '@/components/MissionHub'
import { CommunityHeader } from '@/components/CommunityHeader'

export const revalidate = 0

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <CommunityHeader />
        <MissionHub />
      </div>
    </main>
  )
}
