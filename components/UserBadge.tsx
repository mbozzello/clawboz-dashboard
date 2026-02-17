'use client'

import { useState } from 'react'
import { useUser } from './UserIdentityProvider'
import { avatarColor } from '@/lib/utils'

export function UserBadge() {
  const { user, isLoading, logout } = useUser()
  const [showMenu, setShowMenu] = useState(false)

  if (isLoading || !user) return null

  const initial = user.handle.charAt(0).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div
          className={`w-6 h-6 rounded-full ${avatarColor(user.handle)} flex items-center justify-center text-white text-xs font-bold`}
        >
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-700">
          @{user.handle}
        </span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">@{user.handle}</p>
              {user.twitterHandle && (
                <a
                  href={`https://x.com/${user.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:text-violet-700"
                >
                  @{user.twitterHandle} on X
                </a>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => {
                logout()
                setShowMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
