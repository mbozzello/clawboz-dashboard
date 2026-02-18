import { notFound } from 'next/navigation'
import { fetchMissionDetail, ParsedMission, MissionDetail } from '@/lib/mission-parser'
import { SkillPageClient } from './SkillPageClient'

export default async function SkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ output?: string }>
}) {
  const { slug } = await params
  const { output } = await searchParams

  // Date is always the first 10 chars of the slug (YYYY-MM-DD)
  const date = slug.slice(0, 10)

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  // Fetch + parse directly (no self-HTTP call - avoids localhost failure on Vercel)
  const detail = await fetchMissionDetail(date)
  if (!detail) notFound()

  const mission: ParsedMission | undefined = detail.missions.find(m => m.slug === slug)
  if (!mission) notFound()

  const missionDetail: MissionDetail = detail

  // ?output=markdown — return the raw markdown section for this mission as plain text
  if (output === 'markdown') {
    const rawContent = detail.rawContent
    // Split on mission headers; sections[0]=preamble, sections[1]=mission1, etc.
    const sections = rawContent.split(/^## Mission \d+: .+$/gm)
    const sectionContent = sections[mission.index] || ''
    const markdownOutput = `## Mission ${mission.index}: ${mission.title}\n${sectionContent.trim()}`

    return new Response(markdownOutput, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    }) as unknown as React.ReactElement
  }

  return <SkillPageClient detail={missionDetail} mission={mission} />
}
