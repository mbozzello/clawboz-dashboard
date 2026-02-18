import { NextRequest, NextResponse } from 'next/server'
import { getSkillVotes, voteSkill } from '@/lib/db'

// GET /api/votes?date=YYYY-MM-DD&idx=N&voterId=XYZ
// GET /api/votes?toolId=napkin&voterId=XYZ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const toolId = searchParams.get('toolId')
  const date = searchParams.get('date')
  const idx = searchParams.get('idx')
  const voterId = searchParams.get('voterId') || undefined

  if (toolId) {
    const stats = await getSkillVotes('', 0, voterId, toolId)
    return NextResponse.json(stats)
  }

  if (!date || idx === null) {
    return NextResponse.json({ error: 'Missing date or idx' }, { status: 400 })
  }

  const stats = await getSkillVotes(date, Number(idx), voterId)
  return NextResponse.json(stats)
}

// POST /api/votes
// body: { date, missionIdx, direction, voterId } OR { toolId, direction, voterId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, missionIdx, direction, voterId, toolId } = body

    if (!direction || !voterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!toolId && (!date || missionIdx === undefined)) {
      return NextResponse.json({ error: 'Missing date/missionIdx or toolId' }, { status: 400 })
    }

    if (direction !== 1 && direction !== -1) {
      return NextResponse.json({ error: 'direction must be 1 or -1' }, { status: 400 })
    }

    // Sanitise voterId
    const safeVoterId = String(voterId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
    if (!safeVoterId) {
      return NextResponse.json({ error: 'Invalid voterId' }, { status: 400 })
    }

    // Sanitise toolId if present
    const safeToolId = toolId ? String(toolId).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) : undefined

    const result = await voteSkill(
      date || '', Number(missionIdx || 0), safeVoterId, direction as 1 | -1, safeToolId
    )
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const stats = await getSkillVotes(
      date || '', Number(missionIdx || 0), safeVoterId, safeToolId
    )
    return NextResponse.json(stats)
  } catch (e) {
    console.error('Vote error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
