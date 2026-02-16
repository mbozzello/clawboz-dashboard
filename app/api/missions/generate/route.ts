import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { isLocal } from '@/lib/config'

// POST /api/missions/generate — run trend coach, wait for completion
export async function POST() {
  if (!isLocal()) {
    return NextResponse.json({
      success: false,
      output: '',
      errors: 'Mission generation requires running locally. Run the dashboard with `npm run dev` and use the generate button there. Missions will sync to GitHub and appear here on Vercel.',
      missionFile: null,
    }, { status: 400 })
  }

  const trendCoachPath = `${process.env.HOME}/ClawBoz/clawboz-trend-coach`
  const command = `cd ${trendCoachPath} && source .venv/bin/activate && python src/run.py 2>&1`

  try {
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(command, { timeout: 120_000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ stdout: stdout || '', stderr: stderr || error.message })
        } else {
          resolve({ stdout, stderr })
        }
      })
    })

    const generatedMatch = result.stdout.match(/Generated:? (.+\.md)/)
    const missionFile = generatedMatch ? generatedMatch[1].trim() : null
    const success = result.stdout.includes('Mission pack ready') || result.stdout.includes('Generated')

    return NextResponse.json({
      success,
      output: result.stdout,
      errors: result.stderr || null,
      missionFile,
    })
  } catch (error) {
    console.error('Failed to run Trend Coach:', error)
    return NextResponse.json(
      { success: false, output: '', errors: String(error), missionFile: null },
      { status: 500 }
    )
  }
}
