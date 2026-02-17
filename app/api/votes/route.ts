import { NextRequest, NextResponse } from 'next/server'
import { getSkillVotes, voteSkill } from '@/lib/db'

// GET /api/votes?date=YYYY-MM-DD&idx=N&voterId=XYZ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const idx = searchParams.get('idx')
  const voterId = searchParams.get('voterId') || undefined

  if (!date || idx === null) {
    return NextResponse.json({ error: 'Missing date or idx' }, { status: 400 })
  }

  const stats = await getSkillVotes(date, Number(idx), voterId)
  return NextResponse.json(stats)
}

// POST /api/votes
// body: { date, missionIdx, direction: 1 | -1, voterId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, missionIdx, direction, voterId } = body

    if (!date || missionIdx === undefined || !direction || !voterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (direction !== 1 && direction !== -1) {
      return NextResponse.json({ error: 'direction must be 1 or -1' }, { status: 400 })
    }

    // Sanitise voterId — only allow alphanumeric + hyphens, max 64 chars
    const safeVoterId = String(voterId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
    if (!safeVoterId) {
      return NextResponse.json({ error: 'Invalid voterId' }, { status: 400 })
    }

    const result = await voteSkill(date, Number(missionIdx), safeVoterId, direction as 1 | -1)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return updated stats
    const stats = await getSkillVotes(date, Number(missionIdx), safeVoterId)
    return NextResponse.json(stats)
  } catch (e) {
    console.error('Vote error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
