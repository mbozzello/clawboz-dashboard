/**
 * Upstash Redis helpers for the ClawBoz community.
 * Works on both local dev (with env vars) and Vercel (auto-configured).
 */

import { Redis } from '@upstash/redis'
import { CommunityUser } from './community-types'

// Lazy-init Redis client (only when actually called)
let _redis: Redis | null = null

function getRedis(): Redis {
  if (_redis) return _redis

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      'Redis not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN to your environment variables.'
    )
  }

  _redis = new Redis({ url, token })
  return _redis
}

// ─── Reserved handles that can't be claimed ───
const RESERVED_HANDLES = new Set([
  'admin', 'clawboz', 'system', 'mod', 'moderator',
  'help', 'support', 'api', 'null', 'undefined',
])

// ─── User operations ───

export async function isHandleTaken(handle: string): Promise<boolean> {
  const normalized = handle.toLowerCase()
  if (RESERVED_HANDLES.has(normalized)) return true
  const redis = getRedis()
  return (await redis.sismember('handles', normalized)) === 1
}

export async function createUser(
  handle: string,
  sessionToken: string,
  twitterHandle?: string
): Promise<CommunityUser> {
  const redis = getRedis()
  const normalized = handle.toLowerCase()

  const user: CommunityUser = {
    handle,
    twitterHandle: twitterHandle || '',
    joinedAt: new Date().toISOString(),
    sessionToken,
  }

  // Store user hash
  await redis.hset(`user:${normalized}`, {
    handle: user.handle,
    twitterHandle: user.twitterHandle || '',
    joinedAt: user.joinedAt,
    sessionToken: user.sessionToken,
  })
  // Add to handle set for uniqueness checks
  await redis.sadd('handles', normalized)
  // Map session -> handle for reverse lookup
  await redis.set(`session:${sessionToken}`, normalized)
  // Increment member count
  await redis.incr('member-count')

  return user
}

export async function getUserBySession(token: string): Promise<CommunityUser | null> {
  const redis = getRedis()
  const handle = await redis.get<string>(`session:${token}`)
  if (!handle) return null

  const data = await redis.hgetall(`user:${handle}`)
  if (!data || !data.handle) return null

  return {
    handle: data.handle as string,
    twitterHandle: (data.twitterHandle as string) || '',
    joinedAt: data.joinedAt as string,
    sessionToken: data.sessionToken as string,
  }
}

export async function getMemberCount(): Promise<number> {
  try {
    const redis = getRedis()
    const count = await redis.get<number>('member-count')
    return count || 0
  } catch {
    return 0
  }
}

// ─── Completion operations ───

export interface CompletionRecord {
  handle: string
  proof: string
  completedAt: string
}

export async function submitCompletion(
  date: string,
  missionIdx: number,
  handle: string,
  proof: string
): Promise<{ ok: boolean; error?: string }> {
  const redis = getRedis()
  const key = `completion:${date}:${missionIdx}:${handle.toLowerCase()}`

  // Check if already submitted
  const existing = await redis.exists(key)
  if (existing) {
    return { ok: false, error: 'You already claimed this mission' }
  }

  const record: CompletionRecord = {
    handle,
    proof,
    completedAt: new Date().toISOString(),
  }

  // Store the completion
  await redis.hset(key, {
    handle: record.handle,
    proof: record.proof,
    completedAt: record.completedAt,
  })

  // Add to the list of completers for this mission
  await redis.rpush(`completions:${date}:${missionIdx}`, handle.toLowerCase())

  // Track per-user completions
  await redis.sadd(`user-completions:${handle.toLowerCase()}`, `${date}:${missionIdx}`)

  return { ok: true }
}

export async function getCompleters(
  date: string,
  missionIdx: number
): Promise<CompletionRecord[]> {
  const redis = getRedis()
  const handles = await redis.lrange(`completions:${date}:${missionIdx}`, 0, -1)

  if (!handles || handles.length === 0) return []

  const completions: CompletionRecord[] = []
  for (const h of handles) {
    const data = await redis.hgetall(`completion:${date}:${missionIdx}:${h}`)
    if (data && data.handle) {
      completions.push({
        handle: data.handle as string,
        proof: data.proof as string,
        completedAt: data.completedAt as string,
      })
    }
  }

  return completions
}

export async function getCompletionCount(date: string, missionIdx: number): Promise<number> {
  try {
    const redis = getRedis()
    return await redis.llen(`completions:${date}:${missionIdx}`)
  } catch {
    return 0
  }
}

// ─── Comment operations ───

export interface CommentRecord {
  handle: string
  message: string
  createdAt: string
}

export async function addComment(
  date: string,
  missionIdx: number,
  handle: string,
  message: string
): Promise<CommentRecord> {
  const redis = getRedis()

  const comment: CommentRecord = {
    handle,
    message,
    createdAt: new Date().toISOString(),
  }

  await redis.rpush(
    `comments:${date}:${missionIdx}`,
    JSON.stringify(comment)
  )

  // Update comment count
  await redis.hincrby(`comment-count:${date}`, String(missionIdx), 1)

  return comment
}

export async function getComments(
  date: string,
  missionIdx: number
): Promise<CommentRecord[]> {
  const redis = getRedis()
  const raw = await redis.lrange(`comments:${date}:${missionIdx}`, 0, -1)

  if (!raw || raw.length === 0) return []

  return raw.map((item) => {
    if (typeof item === 'string') return JSON.parse(item) as CommentRecord
    return item as CommentRecord
  })
}

export async function getCommentCounts(date: string): Promise<Record<string, number>> {
  try {
    const redis = getRedis()
    const data = await redis.hgetall(`comment-count:${date}`)
    if (!data) return {}
    const result: Record<string, number> = {}
    for (const [k, v] of Object.entries(data)) {
      result[k] = Number(v)
    }
    return result
  } catch {
    return {}
  }
}

// ─── Rating operations ───
// Users rate a mission (date + missionIdx) 1-5 stars.
// We store each user's rating and maintain running sum/count for fast avg lookup.

export async function rateMission(
  date: string,
  missionIdx: number,
  handle: string,
  stars: number
): Promise<{ ok: boolean; error?: string }> {
  if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return { ok: false, error: 'Rating must be 1-5 stars' }
  }

  const redis = getRedis()
  const missionKey = `ratings:${date}:${missionIdx}`
  const userKey = `${missionKey}:${handle.toLowerCase()}`

  // Check if user already rated — if so, adjust the running totals
  const existing = await redis.get<number>(userKey)

  if (existing !== null) {
    // Update: subtract old rating, add new one
    await redis.set(userKey, stars)
    await redis.hincrby(`rating-stats:${date}:${missionIdx}`, 'sum', stars - existing)
  } else {
    // New rating
    await redis.set(userKey, stars)
    await redis.hincrby(`rating-stats:${date}:${missionIdx}`, 'sum', stars)
    await redis.hincrby(`rating-stats:${date}:${missionIdx}`, 'count', 1)
    // Track in a sorted set for "top rated" queries — score = avg (updated below)
  }

  // Recalculate avg and update the sorted set
  const stats = await redis.hgetall(`rating-stats:${date}:${missionIdx}`)
  const sum = Number(stats?.sum || 0)
  const count = Number(stats?.count || 1)
  const avg = sum / count

  // Store in sorted set: member = "date:missionIdx", score = avg
  // We also store the title separately for display
  await redis.zadd('top-rated-missions', { score: avg, member: `${date}:${missionIdx}` })

  return { ok: true }
}

export async function getUserRating(
  date: string,
  missionIdx: number,
  handle: string
): Promise<number | null> {
  try {
    const redis = getRedis()
    const rating = await redis.get<number>(`ratings:${date}:${missionIdx}:${handle.toLowerCase()}`)
    return rating
  } catch {
    return null
  }
}

export interface RatingStats {
  avg: number
  count: number
}

export async function getMissionRating(
  date: string,
  missionIdx: number
): Promise<RatingStats> {
  try {
    const redis = getRedis()
    const stats = await redis.hgetall(`rating-stats:${date}:${missionIdx}`)
    if (!stats || !stats.count) return { avg: 0, count: 0 }
    const sum = Number(stats.sum || 0)
    const count = Number(stats.count || 0)
    return { avg: count > 0 ? sum / count : 0, count }
  } catch {
    return { avg: 0, count: 0 }
  }
}

export interface TopRatedMission {
  date: string
  missionIdx: number
  avg: number
  count: number
}

export async function getTopRatedMissions(limit = 10): Promise<TopRatedMission[]> {
  try {
    const redis = getRedis()
    // Get top rated by avg score (descending)
    const results = await redis.zrange('top-rated-missions', 0, limit - 1, { rev: true, withScores: true })

    const missions: TopRatedMission[] = []
    for (let i = 0; i < results.length; i += 2) {
      const member = results[i] as string
      const avg = Number(results[i + 1])
      const [date, idxStr] = member.split(':')
      const missionIdx = Number(idxStr)

      // Get the count for this mission
      const stats = await redis.hgetall(`rating-stats:${date}:${missionIdx}`)
      const count = Number(stats?.count || 0)

      // Only include missions with at least 1 rating
      if (count > 0) {
        missions.push({ date, missionIdx, avg, count })
      }
    }

    return missions
  } catch {
    return []
  }
}

// ─── Vote operations ───
// Users upvote (+1) or downvote (-1) a skill.
// Redis keys:
//   votes:{date}:{missionIdx}:{voterId}  → "1" | "-1"   (per-user vote)
//   vote-score:{date}:{missionIdx}       → Hash { up, down }
//   top-voted-skills                     → Sorted Set (score = net votes)

export interface VoteStats {
  up: number
  down: number
  net: number
  userVote: 1 | -1 | 0  // caller's current vote (0 = no vote)
}

export async function voteSkill(
  date: string,
  missionIdx: number,
  voterId: string,
  direction: 1 | -1,
  toolId?: string
): Promise<{ ok: boolean; error?: string }> {
  const redis = getRedis()
  const keyBase = toolId ? `repo:${toolId}` : `${date}:${missionIdx}`
  const userKey = `votes:${keyBase}:${voterId}`
  const statsKey = `vote-score:${keyBase}`
  const member = keyBase
  const sortedSetKey = toolId ? 'top-voted-tools' : 'top-voted-skills'

  const existing = await redis.get<string>(userKey)
  const existingVote = existing ? Number(existing) as (1 | -1) : 0

  if (existingVote === direction) {
    // Toggle off — remove vote
    await redis.del(userKey)
    if (direction === 1) {
      await redis.hincrby(statsKey, 'up', -1)
    } else {
      await redis.hincrby(statsKey, 'down', -1)
    }
    await redis.zincrby(sortedSetKey, -direction, member)
  } else {
    // New vote or flip
    if (existingVote !== 0) {
      // Undo old vote first
      if (existingVote === 1) {
        await redis.hincrby(statsKey, 'up', -1)
      } else {
        await redis.hincrby(statsKey, 'down', -1)
      }
      await redis.zincrby(sortedSetKey, -existingVote, member)
    }
    // Apply new vote
    await redis.set(userKey, String(direction))
    if (direction === 1) {
      await redis.hincrby(statsKey, 'up', 1)
    } else {
      await redis.hincrby(statsKey, 'down', 1)
    }
    await redis.zincrby(sortedSetKey, direction, member)
  }

  return { ok: true }
}

export async function getSkillVotes(
  date: string,
  missionIdx: number,
  voterId?: string,
  toolId?: string
): Promise<VoteStats> {
  try {
    const redis = getRedis()
    const keyBase = toolId ? `repo:${toolId}` : `${date}:${missionIdx}`
    const statsKey = `vote-score:${keyBase}`
    const stats = await redis.hgetall(statsKey)
    const up = Math.max(0, Number(stats?.up || 0))
    const down = Math.max(0, Number(stats?.down || 0))

    let userVote: 1 | -1 | 0 = 0
    if (voterId) {
      const userKey = `votes:${keyBase}:${voterId}`
      const uv = await redis.get<string>(userKey)
      if (uv) userVote = Number(uv) as (1 | -1)
    }

    return { up, down, net: up - down, userVote }
  } catch {
    return { up: 0, down: 0, net: 0, userVote: 0 }
  }
}

export async function getTopVotedSkills(limit = 50): Promise<{ date: string; missionIdx: number; net: number }[]> {
  try {
    const redis = getRedis()
    const results = await redis.zrange('top-voted-skills', 0, limit - 1, { rev: true, withScores: true })
    const skills: { date: string; missionIdx: number; net: number }[] = []
    for (let i = 0; i < results.length; i += 2) {
      const member = results[i] as string
      const score = Number(results[i + 1])
      // member format: "YYYY-MM-DD:N"
      const lastColon = member.lastIndexOf(':')
      const date = member.slice(0, lastColon)
      const missionIdx = Number(member.slice(lastColon + 1))
      skills.push({ date, missionIdx, net: score })
    }
    return skills
  } catch {
    return []
  }
}
