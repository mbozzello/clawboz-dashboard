'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { UserProfile } from '@/lib/community-types'

interface UserContextType {
  user: UserProfile | null
  isLoading: boolean
  claimHandle: (
    handle: string,
    twitterHandle?: string
  ) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  claimHandle: async () => ({ ok: false }),
  logout: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

const SESSION_KEY = 'clawboz-session-token'

export function UserIdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, check for existing session
  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem(SESSION_KEY)
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch('/api/users/me', {
          headers: { 'x-session-token': token },
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          // Invalid session — clean up
          localStorage.removeItem(SESSION_KEY)
        }
      } catch {
        // API not available — just proceed without user
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const claimHandle = useCallback(
    async (
      handle: string,
      twitterHandle?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/users/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle, twitterHandle }),
        })

        const data = await res.json()

        if (!res.ok) {
          return { ok: false, error: data.error || 'Something went wrong' }
        }

        // Store session token in localStorage (cookie is set by the API)
        if (data.sessionToken) {
          localStorage.setItem(SESSION_KEY, data.sessionToken)
        }

        setUser(data.user)
        return { ok: true }
      } catch {
        return { ok: false, error: 'Network error. Try again.' }
      }
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <UserContext.Provider value={{ user, isLoading, claimHandle, logout }}>
      {children}
    </UserContext.Provider>
  )
}
