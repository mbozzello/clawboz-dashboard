/**
 * Lightweight session management.
 * Uses a random UUID token stored in a cookie + localStorage.
 */

import { cookies } from 'next/headers'
import { getUserBySession } from './db'
import { UserProfile } from './community-types'

const SESSION_COOKIE = 'clawboz-session'

/** Generate a random session token */
export function generateSessionToken(): string {
  return crypto.randomUUID()
}

/** Read session token from the request cookies (server-side) */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value || null
}

/** Get the current user from the session cookie (server-side) */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = await getSessionToken()
  if (!token) return null

  const user = await getUserBySession(token)
  if (!user) return null

  return {
    handle: user.handle,
    twitterHandle: user.twitterHandle || undefined,
    joinedAt: user.joinedAt,
  }
}

/** Cookie options for the session token */
export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: false, // Needs to be readable by client JS for the provider
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  }
}
