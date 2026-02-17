import { NextRequest, NextResponse } from 'next/server'
import { rateMission, getMissionRating, getUserRating, getTopRatedMissions } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/ratings?date=2026-02-16&idx=0 — get rating stats + user's rating
// GET /api/ratings?top=true — get top rated missions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Top rated list
    if (searchParams.get('top') === 'true') {
      const limit = Number(searchParams.get('limit') || 10)
      const missions = await getTopRatedMissions(limit)
      return NextResponse.json({ missions })
    }

    // Single mission rating
    const date = searchParams.get('date')
    const idx = searchParams.get('idx')

    if (!date || idx === null) {
      return NextResponse.json({ error: 'date and idx are required' }, { status: 400 })
    }

    const stats = await getMissionRating(date, Number(idx))

    // Also get the current user's rating if logged in
    let userRating: number | null = null
    try {
      const user = await getCurrentUser()
      if (user) {
        userRating = await getUserRating(date, Number(idx), user.handle)
      }
    } catch {
      // Not logged in — that's fine
    }

    return NextResponse.json({ ...stats, userRating })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ avg: 0, count: 0, userRating: null })
    }
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}

// POST /api/ratings — submit a rating (no auth required; caller supplies a voter ID)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, missionIdx, stars, voterId } = body as {
      date?: string
      missionIdx?: number
      stars?: number
      voterId?: string
    }

    if (!date || missionIdx === undefined || stars === undefined || !voterId) {
      return NextResponse.json(
        { error: 'date, missionIdx, stars, and voterId are required' },
        { status: 400 }
      )
    }

    if (stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'stars must be 1–5' }, { status: 400 })
    }

    // Use the caller-supplied voterId as the "handle" for de-duplication
    const handle = `anon_${voterId.slice(0, 16)}`
    const result = await rateMission(date, missionIdx, handle, stars)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return updated stats
    const stats = await getMissionRating(date, missionIdx)
    return NextResponse.json({ success: true, ...stats, userRating: stars })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ error: 'Community features are being set up' }, { status: 503 })
    }
    console.error('Rating error:', msg)
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
  }
}
