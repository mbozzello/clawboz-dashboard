import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isLocal, getMissionsGitHubDir } from '@/lib/config'

const LOCAL_MISSIONS_DIR = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')

// GET /api/missions — list every mission pack
export async function GET() {
  try {
    if (isLocal()) {
      return NextResponse.json({ missions: listLocal() })
    } else {
      const missions = await listFromGitHub()
      return NextResponse.json({ missions })
    }
  } catch (error) {
    console.error('Error listing missions:', error)
    return NextResponse.json({ missions: [] }, { status: 500 })
  }
}

/* -------- local (dev) -------- */

function listLocal() {
  if (!fs.existsSync(LOCAL_MISSIONS_DIR)) return []

  return fs.readdirSync(LOCAL_MISSIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort().reverse()
    .map(filename => {
      const content = fs.readFileSync(path.join(LOCAL_MISSIONS_DIR, filename), 'utf-8')
      return parseMeta(filename, content)
    })
}

/* -------- GitHub (Vercel) -------- */

async function listFromGitHub() {
  const res = await fetch(getMissionsGitHubDir(), {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
    next: { revalidate: 60 }, // cache 60s
  })

  if (!res.ok) return []

  const files: { name: string; download_url: string }[] = await res.json()

  const mdFiles = files
    .filter(f => f.name.endsWith('.md'))
    .sort((a, b) => b.name.localeCompare(a.name))

  const missions = await Promise.all(
    mdFiles.map(async f => {
      const contentRes = await fetch(f.download_url, { next: { revalidate: 60 } })
      const content = await contentRes.text()
      return parseMeta(f.name, content)
    })
  )

  return missions
}

/* -------- shared -------- */

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseMeta(filename: string, content: string) {
  const date = filename.replace('.md', '')
  const lessonCount = (content.match(/^## Mission \d+:/gm) || []).length
  const titles: string[] = []
  const titleMatches = content.matchAll(/^## Mission \d+: (.+)$/gm)
  for (const m of titleMatches) titles.push(m[1].trim())

  const slugs = titles.map(t => `${date}-${slugify(t)}`)

  // Extract a short description, difficulty, and source from each mission section
  const descriptions: string[] = []
  const difficulties: string[] = []
  const sources: string[] = []
  const sourceUrls: string[] = []
  const missionSections = content.split(/^## Mission \d+:/gm).slice(1)
  for (const section of missionSections) {
    // Description: first non-empty line after "What You're Building"
    const buildMatch = section.match(/###[^\n]*What You(?:'|')?re Building[^\n]*\n+([\s\S]*?)(?:\n###|\n##|$)/)
    if (buildMatch) {
      const raw = buildMatch[1].trim().split('\n').find(l => l.trim().length > 0) || ''
      descriptions.push(raw.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    } else {
      descriptions.push('')
    }
    // Difficulty: extract from **📊 Difficulty:** line
    const diffMatch = section.match(/\*\*.*?Difficulty:?\*\*\s*(.+)/i)
    difficulties.push(diffMatch ? diffMatch[1].trim() : '')
    // Source: parse "*Inspired by: [Label](url)*" or "*Inspired by: Label - desc*"
    const srcRaw = section.match(/\*Inspired by:\s*([\s\S]*?)\*/)
    if (srcRaw) {
      const inner = srcRaw[1].trim()
      // Check for markdown link format: [label](url)
      const mdLink = inner.match(/^\[([^\]]+)\]\(([^)]+)\)/)
      if (mdLink) {
        sources.push(mdLink[1].trim())
        sourceUrls.push(mdLink[2].trim())
      } else {
        // Plain text: "Label - description" — take just the label part
        const label = inner.replace(/\s*-[^-].*$/, '').trim()
        sources.push(label)
        sourceUrls.push('')
      }
    } else {
      sources.push('')
      sourceUrls.push('')
    }
  }

  return { date, lessonCount, titles, slugs, descriptions, difficulties, sources, sourceUrls }
}
