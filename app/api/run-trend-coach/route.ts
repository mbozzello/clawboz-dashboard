import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const trendCoachPath = `${process.env.HOME}/ClawBoz/clawboz-trend-coach`

    // Run the trend coach in the background
    const command = `cd ${trendCoachPath} && source .venv/bin/activate && python src/run.py`

    // Execute without waiting for completion (async)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Trend Coach error:', error)
      }
      console.log('Trend Coach output:', stdout)
    })

    return NextResponse.json({
      success: true,
      message: 'Trend Coach started in background'
    })
  } catch (error) {
    console.error('Failed to start Trend Coach:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to start Trend Coach' },
      { status: 500 }
    )
  }
}
