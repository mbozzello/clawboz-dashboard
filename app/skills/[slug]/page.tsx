import { notFound } from 'next/navigation'
import { fetchMissionDetail, ParsedMission, MissionDetail } from '@/lib/mission-parser'
import { SkillPageClient } from './SkillPageClient'

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Date is always the first 10 chars of the slug (YYYY-MM-DD)
  const date = slug.slice(0, 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  // Fetch + parse directly (no self-HTTP call — avoids localhost failure on Vercel)
  const detail = await fetchMissionDetail(date)
  if (!detail) notFound()

  const mission: ParsedMission | undefined = detail.missions.find(m => m.slug === slug)
  if (!mission) notFound()

  return <SkillPageClient detail={detail as MissionDetail} mission={mission} />
}
