import { NextRequest, NextResponse } from 'next/server'
import { submitCompletion, getCompleters } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/completions?date=2026-02-16&idx=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const idx = searchParams.get('idx')

    if (!date || idx === null) {
      return NextResponse.json({ error: 'date and idx are required' }, { status: 400 })
    }

    const completers = await getCompleters(date, Number(idx))
    return NextResponse.json({ completers })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ completers: [] })
    }
    return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 })
  }
}

// POST /api/completions — submit a completion
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })
    }

    const body = await request.json()
    const { date, missionIdx, proof } = body as {
      date?: string
      missionIdx?: number
      proof?: string
    }

    if (!date || missionIdx === undefined || !proof) {
      return NextResponse.json(
        { error: 'date, missionIdx, and proof are required' },
        { status: 400 }
      )
    }

    const trimmedProof = proof.trim()
    if (trimmedProof.length < 10 || trimmedProof.length > 280) {
      return NextResponse.json(
        { error: 'Proof must be 10-280 characters' },
        { status: 400 }
      )
    }

    const result = await submitCompletion(date, missionIdx, user.handle, trimmedProof)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ error: 'Community features are being set up' }, { status: 503 })
    }
    console.error('Completion submit error:', msg)
    return NextResponse.json({ error: 'Failed to submit completion' }, { status: 500 })
  }
}
