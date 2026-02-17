/**
 * Community types for the ClawBoz PM community.
 */

export interface CommunityUser {
  handle: string
  twitterHandle?: string
  joinedAt: string
  sessionToken: string
}

export interface Completion {
  handle: string
  proof: string
  completedAt: string
}

export interface Comment {
  handle: string
  message: string
  createdAt: string
}

/** Shape returned by /api/users/me */
export interface UserProfile {
  handle: string
  twitterHandle?: string
  joinedAt: string
}
