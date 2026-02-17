import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchAllTrends } from '@/lib/trend-fetcher'
import { generateMissionsFromTrends, commitMissionToGitHub } from '@/lib/mission-generator'
import { isLocal } from '@/lib/config'

export const maxDuration = 60 // Allow up to 60s on Vercel

// Vercel Cron sends GET requests
// Manual triggers send POST
async function handleGenerate() {
  const date = new Date().toISOString().split('T')[0]

  try {
    // Step 1: Fetch trends from the web
    const trends = await fetchAllTrends()

    if (trends.length === 0) {
      return NextResponse.json({
        success: false,
        output: 'Failed to fetch any trends from web sources.',
        errors: 'No trends fetched',
      }, { status: 500 })
    }

    const trendSummary = trends.map(t => `✅ ${t.name}: ${t.content.split('\n').length} items`).join('\n')

    // Step 2: Check if there's already a file for today — if so, we'll append
    let existingMarkdown = ''
    let existingCount = 0

    if (isLocal()) {
      const localDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')
      const localPath = path.join(localDir, `${date}.md`)
      if (fs.existsSync(localPath)) {
        existingMarkdown = fs.readFileSync(localPath, 'utf-8')
        // Count existing missions by looking for "## Mission N:" headers
        const matches = existingMarkdown.match(/^## Mission \d+:/gm)
        existingCount = matches ? matches.length : 0
      }
    } else {
      // On Vercel, try to fetch the existing file from GitHub
      try {
        const { getMissionRawUrl } = await import('@/lib/config')
        const res = await fetch(getMissionRawUrl(`${date}.md`))
        if (res.ok) {
          existingMarkdown = await res.text()
          const matches = existingMarkdown.match(/^## Mission \d+:/gm)
          existingCount = matches ? matches.length : 0
        }
      } catch {
        // No existing file — start fresh
      }
    }

    // Step 3: Generate new skills with Claude (3 per batch)
    const { missions, markdown: newMarkdown } = await generateMissionsFromTrends(trends, 3)

    // Step 4: If appending, renumber missions and merge
    let finalMarkdown: string
    if (existingMarkdown && existingCount > 0) {
      // Renumber new missions to continue from where we left off
      let renumbered = newMarkdown
      missions.forEach((_, i) => {
        const oldNum = i + 1
        const newNum = existingCount + i + 1
        renumbered = renumbered.replace(
          new RegExp(`^## Mission ${oldNum}:`, 'm'),
          `## Mission ${newNum}:`
        )
      })
      // Strip the header from the new markdown (keep just the mission sections)
      const missionStart = renumbered.indexOf('## Mission')
      const newMissions = missionStart >= 0 ? renumbered.substring(missionStart) : renumbered
      finalMarkdown = existingMarkdown.trimEnd() + '\n\n---\n\n' + newMissions
    } else {
      finalMarkdown = newMarkdown
    }

    // Step 5: Save
    if (isLocal()) {
      const localDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')
      fs.mkdirSync(localDir, { recursive: true })
      fs.writeFileSync(path.join(localDir, `${date}.md`), finalMarkdown)

      const hqDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-hq-data', 'missions')
      fs.mkdirSync(hqDir, { recursive: true })
      fs.writeFileSync(path.join(hqDir, `${date}.md`), finalMarkdown)
    }

    // Always try to commit to GitHub
    const committed = await commitMissionToGitHub(finalMarkdown, date)

    const totalSkills = existingCount + missions.length
    const missionTitles = missions.map((m, i) => `${existingCount + i + 1}. ${m.title}`).join('\n')

    return NextResponse.json({
      success: true,
      output: [
        `📡 Fetched trends:`,
        trendSummary,
        ``,
        `🤖 Generated ${missions.length} new skills${existingCount > 0 ? ` (${totalSkills} total today)` : ''}:`,
        missionTitles,
        ``,
        committed ? `✅ Committed to GitHub` : `⚠️ GitHub commit skipped (no GITHUB_TOKEN)`,
        ``,
        `📄 Skill pack ready for ${date}`,
      ].join('\n'),
      errors: null,
      date,
    })
  } catch (error: unknown) {
    console.error('Generation failed:', error)

    let errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('ANTHROPIC_API_KEY')) {
      errorMsg = 'ANTHROPIC_API_KEY not configured. Add it to Vercel Environment Variables (Settings → Environment Variables) or to your local .env.local file.'
    } else if (errorMsg.includes('credit balance')) {
      errorMsg = 'Your Anthropic API account needs credits. Go to https://console.anthropic.com/settings/billing to add credits, then try again.'
    }

    return NextResponse.json({
      success: false,
      output: '',
      errors: errorMsg,
      date,
    }, { status: 500 })
  }
}

// POST — manual trigger from the dashboard
export async function POST() {
  return handleGenerate()
}

// GET — Vercel Cron trigger (runs at 7am and 7pm daily)
export async function GET(request: NextRequest) {
  // Verify it's from Vercel Cron (optional but good practice)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return handleGenerate()
}
