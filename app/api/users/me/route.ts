import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me — get the currently logged-in user
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    // If Redis is not configured, return 401 gracefully
    if (message.includes('Redis not configured')) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }

    console.error('Get user error:', message)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
