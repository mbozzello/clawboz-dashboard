'use client'

import { useState } from 'react'
import { useUser } from './UserIdentityProvider'

interface CompletionButtonProps {
  date: string
  missionIdx: number
  allCriteriaChecked: boolean
  alreadyCompleted: boolean
  onCompleted: () => void
}

export function CompletionButton({
  date,
  missionIdx,
  allCriteriaChecked,
  alreadyCompleted,
  onCompleted,
}: CompletionButtonProps) {
  const { user } = useUser()
  const [showForm, setShowForm] = useState(false)
  const [proof, setProof] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) return null
  if (alreadyCompleted) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-emerald-800">Mission completed! Your name is on the board.</span>
      </div>
    )
  }

  if (!allCriteriaChecked) {
    return (
      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">
          Complete all success criteria to claim this mission
        </p>
      </div>
    )
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
      >
        Claim Completion
      </button>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = proof.trim()
    if (trimmed.length < 10) {
      setError('Tell us a bit more about what you built (10+ chars)')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, missionIdx, proof: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      onCompleted()
      setShowForm(false)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-violet-200 rounded-lg p-4 bg-violet-50">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-gray-900 text-sm">Claim Your Completion</h4>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        Tell the crew what you built or share a link. This shows up on the mission board.
      </p>
      <textarea
        value={proof}
        onChange={(e) => { setProof(e.target.value); setError('') }}
        placeholder="I built a Gmail analyzer that tracks my top senders using Claude + MCP..."
        maxLength={280}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none bg-white"
        disabled={submitting}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-violet-500">{proof.length}/280</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || proof.trim().length < 10}
            className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </form>
  )
}
