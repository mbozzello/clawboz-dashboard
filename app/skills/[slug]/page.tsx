import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { isLocal, getMissionRawUrl } from '@/lib/config'
import { SkillPageClient } from './SkillPageClient'

const LOCAL_MISSIONS_DIR = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')

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

  // Fetch the mission detail from our own API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/missions/${date}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    notFound()
  }

  const detail: MissionDetail = await res.json()
  const mission = detail.missions.find(m => m.slug === slug)

  if (!mission) {
    notFound()
  }

  // ?output=markdown — return the raw markdown section for this mission
  if (output === 'markdown') {
    let rawContent: string

    if (isLocal()) {
      const filePath = path.join(LOCAL_MISSIONS_DIR, `${date}.md`)
      if (!fs.existsSync(filePath)) notFound()
      rawContent = fs.readFileSync(filePath, 'utf-8')
    } else {
      const mdRes = await fetch(getMissionRawUrl(`${date}.md`), {
        next: { revalidate: 60 },
      })
      if (!mdRes.ok) notFound()
      rawContent = await mdRes.text()
    }

    // Extract just this mission's section
    const sections = rawContent.split(/^## Mission \d+: .+$/gm)
    // sections[0] = preamble, sections[1] = mission 1, sections[2] = mission 2, ...
    const sectionIndex = mission.index // 1-based in markdown
    const sectionContent = sections[sectionIndex] || ''
    const markdownOutput = `## Mission ${mission.index}: ${mission.title}\n${sectionContent.trim()}`

    return new Response(markdownOutput, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    }) as unknown as React.ReactElement
  }

  return <SkillPageClient detail={detail} mission={mission} />
}
