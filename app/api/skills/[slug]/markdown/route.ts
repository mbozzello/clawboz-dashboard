import { NextResponse } from 'next/server'
import { fetchMissionDetail } from '@/lib/mission-parser'

// GET /api/skills/[slug]/markdown — returns raw markdown for a single skill
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const date = slug.slice(0, 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const detail = await fetchMissionDetail(date)
  if (!detail) return new NextResponse('Not found', { status: 404 })

  const mission = detail.missions.find(m => m.slug === slug)
  if (!mission) return new NextResponse('Not found', { status: 404 })

  // Extract just this mission's section from raw markdown
  // sections[0] = preamble, sections[1] = Mission 1 body, etc.
  const sections = detail.rawContent.split(/^## Mission \d+: .+$/gm)
  const sectionContent = sections[mission.index] || ''
  const markdownOutput = `## Mission ${mission.index}: ${mission.title}\n${sectionContent.trim()}`

  return new NextResponse(markdownOutput, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  })
}
