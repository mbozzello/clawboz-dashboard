import { NextRequest, NextResponse } from 'next/server'
import { addComment, getComments } from '@/lib/db'

// GET /api/comments?date=2026-02-16&idx=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const idx = searchParams.get('idx')

    if (!date || idx === null) {
      return NextResponse.json({ error: 'date and idx are required' }, { status: 400 })
    }

    const comments = await getComments(date, Number(idx))
    return NextResponse.json({ comments })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ comments: [] })
    }
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/comments — add a comment (no auth required; caller supplies a name)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, missionIdx, message, name } = body as {
      date?: string
      missionIdx?: number
      message?: string
      name?: string
    }

    if (!date || missionIdx === undefined || !message) {
      return NextResponse.json(
        { error: 'date, missionIdx, and message are required' },
        { status: 400 }
      )
    }

    const trimmed = message.trim()
    if (trimmed.length === 0 || trimmed.length > 500) {
      return NextResponse.json(
        { error: 'Message must be 1-500 characters' },
        { status: 400 }
      )
    }

    // Sanitise the display name: strip special chars, fall back to "anonymous"
    const rawName = (name || '').trim().replace(/[^a-zA-Z0-9_\-. ]/g, '').slice(0, 30)
    const handle = rawName.length >= 1 ? rawName : 'anonymous'

    const comment = await addComment(date, missionIdx, handle, trimmed)
    return NextResponse.json({ comment })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Redis not configured')) {
      return NextResponse.json({ error: 'Community features are being set up' }, { status: 503 })
    }
    console.error('Comment error:', msg)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
