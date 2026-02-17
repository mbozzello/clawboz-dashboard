import { NextResponse } from 'next/server'
import { isHandleTaken, createUser } from '@/lib/db'
import { generateSessionToken, sessionCookieOptions } from '@/lib/auth'

// POST /api/users/claim — claim a unique handle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { handle, twitterHandle } = body as {
      handle?: string
      twitterHandle?: string
    }

    // Validate handle format
    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      )
    }

    const trimmed = handle.trim()

    if (trimmed.length < 3 || trimmed.length > 20) {
      return NextResponse.json(
        { error: 'Handle must be 3-20 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Handle can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const taken = await isHandleTaken(trimmed)
    if (taken) {
      return NextResponse.json(
        { error: 'That handle is already taken' },
        { status: 409 }
      )
    }

    // Create user
    const sessionToken = generateSessionToken()
    const user = await createUser(trimmed, sessionToken, twitterHandle?.trim())

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        handle: user.handle,
        twitterHandle: user.twitterHandle || undefined,
        joinedAt: user.joinedAt,
      },
      sessionToken,
    })

    const cookieOpts = sessionCookieOptions()
    response.cookies.set(cookieOpts.name, sessionToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Claim handle error:', message)

    // If Redis is not configured, return a helpful message
    if (message.includes('Redis not configured')) {
      return NextResponse.json(
        { error: 'Community features are being set up. Check back soon!' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500 }
    )
  }
}
