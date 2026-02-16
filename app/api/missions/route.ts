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

function parseMeta(filename: string, content: string) {
  const date = filename.replace('.md', '')
  const lessonCount = (content.match(/^## Mission \d+:/gm) || []).length
  const titles: string[] = []
  const titleMatches = content.matchAll(/^## Mission \d+: (.+)$/gm)
  for (const m of titleMatches) titles.push(m[1].trim())
  return { date, lessonCount, titles }
}
