import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchAllTrends } from '@/lib/trend-fetcher'
import { generateMissionsFromTrends, commitMissionToGitHub } from '@/lib/mission-generator'
import { isLocal } from '@/lib/config'

export const maxDuration = 60 // Allow up to 60s on Vercel

// POST /api/missions/generate — fetch trends, generate with Claude, save
export async function POST() {
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

    // Step 2: Generate missions with Claude
    const { missions, markdown } = await generateMissionsFromTrends(trends, 3)

    // Step 3: Save the markdown
    if (isLocal()) {
      // Save to local filesystem
      const localDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')
      fs.mkdirSync(localDir, { recursive: true })
      fs.writeFileSync(path.join(localDir, `${date}.md`), markdown)

      // Also copy to HQ data for GitHub sync
      const hqDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-hq-data', 'missions')
      fs.mkdirSync(hqDir, { recursive: true })
      fs.writeFileSync(path.join(hqDir, `${date}.md`), markdown)
    }

    // Always try to commit to GitHub (works from both local and Vercel)
    const committed = await commitMissionToGitHub(markdown, date)

    const missionTitles = missions.map((m, i) => `${i + 1}. ${m.title}`).join('\n')

    return NextResponse.json({
      success: true,
      output: [
        `📡 Fetched trends:`,
        trendSummary,
        ``,
        `🤖 Generated ${missions.length} missions:`,
        missionTitles,
        ``,
        committed ? `✅ Committed to GitHub` : `⚠️ GitHub commit skipped (no GITHUB_TOKEN)`,
        ``,
        `📄 Mission pack ready for ${date}`,
      ].join('\n'),
      errors: null,
      date,
    })
  } catch (error: any) {
    console.error('Generation failed:', error)

    let errorMsg = error.message || String(error)
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
