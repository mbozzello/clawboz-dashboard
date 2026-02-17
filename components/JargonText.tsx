'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY, buildGlossaryIndex } from '@/lib/glossary'

// Build the index once at module level
const GLOSSARY_INDEX = buildGlossaryIndex()

// Sorted terms by length descending so longer phrases match before shorter ones
const SORTED_TERMS = [...GLOSSARY_INDEX.keys()].sort((a, b) => b.length - a.length)

interface Segment {
  text: string
  termKey?: string // lowercase key into GLOSSARY_INDEX
}

function parseSegments(text: string): Segment[] {
  if (!text) return []

  const segments: Segment[] = []
  let remaining = text

  while (remaining.length > 0) {
    let matched = false

    for (const termKey of SORTED_TERMS) {
      const idx = remaining.toLowerCase().indexOf(termKey)
      if (idx === -1) continue

      // Make sure we're matching whole words (not part of a longer word)
      const before = remaining[idx - 1]
      const after = remaining[idx + termKey.length]
      const wordBoundaryBefore = !before || /[\s,.()\[\]{}:;"'`\-/]/.test(before)
      const wordBoundaryAfter = !after || /[\s,.()\[\]{}:;"'`\-/]/.test(after)

      if (!wordBoundaryBefore || !wordBoundaryAfter) continue

      // Text before the match
      if (idx > 0) {
        segments.push({ text: remaining.slice(0, idx) })
      }

      // The matched term (preserve original casing from text)
      segments.push({
        text: remaining.slice(idx, idx + termKey.length),
        termKey,
      })

      remaining = remaining.slice(idx + termKey.length)
      matched = true
      break
    }

    if (!matched) {
      // No more matches — push the rest as plain text
      segments.push({ text: remaining })
      break
    }
  }

  return segments
}

/* ------------------------------------------------------------------ */
/* Tooltip — rendered via portal so overflow:hidden never clips it    */
/* ------------------------------------------------------------------ */

const TOOLTIP_WIDTH = 256 // px — matches w-64
const TOOLTIP_GAP = 10    // px gap between term and tooltip box

interface TooltipPortalProps {
  term: string
  definition: string
  anchorRect: DOMRect
}

function TooltipPortal({ term, definition, anchorRect }: TooltipPortalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  // Ideal: centered above the anchor
  let left = scrollX + anchorRect.left + anchorRect.width / 2 - TOOLTIP_WIDTH / 2
  // Clamp so it never goes off-screen (16px edge padding)
  left = Math.max(scrollX + 16, Math.min(left, scrollX + vw - TOOLTIP_WIDTH - 16))

  // Prefer above; fall back to below if not enough room
  const spaceAbove = anchorRect.top
  const spaceBelow = vh - anchorRect.bottom
  const placeAbove = spaceAbove >= 120 || spaceAbove >= spaceBelow

  const top = placeAbove
    ? scrollY + anchorRect.top - TOOLTIP_GAP   // will use transform to shift up
    : scrollY + anchorRect.bottom + TOOLTIP_GAP

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        top,
        left,
        width: TOOLTIP_WIDTH,
        zIndex: 9999,
        // Shift upward when placed above so the box sits above the anchor
        transform: placeAbove ? 'translateY(-100%)' : undefined,
        pointerEvents: 'none',
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-xs leading-relaxed relative">
        <span className="block font-semibold text-white mb-1">{term}</span>
        <span className="block text-gray-300">{definition}</span>
        {/* Arrow */}
        <span
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"
          style={placeAbove
            ? { bottom: -4 }
            : { top: -4 }
          }
        />
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/* Individual term with tooltip                                         */
/* ------------------------------------------------------------------ */

interface GlossaryTooltipProps {
  term: string
  definition: string
  children: React.ReactNode
}

function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect())
    }
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setOpen(false), 80)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <span className="relative inline" ref={ref}>
      <span
        className="underline decoration-dotted decoration-gray-400 cursor-help"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open && anchorRect && (
        <TooltipPortal term={term} definition={definition} anchorRect={anchorRect} />
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* JargonText                                                           */
/* ------------------------------------------------------------------ */

interface JargonTextProps {
  /** The text to scan for jargon terms */
  text: string
  /** Extra CSS classes for the wrapping span */
  className?: string
}

/**
 * Renders `text` with any recognised technical terms underlined.
 * Hovering/focusing a term shows a plain-English tooltip rendered via
 * a React portal — so overflow:hidden on parent cards never clips it.
 */
export function JargonText({ text, className }: JargonTextProps) {
  const segments = useMemo(() => parseSegments(text), [text])

  // If no jargon was found, render plain text to avoid overhead
  if (segments.every(s => !s.termKey)) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.termKey) return <span key={i}>{seg.text}</span>

        const entry = GLOSSARY_INDEX.get(seg.termKey)
        if (!entry) return <span key={i}>{seg.text}</span>

        return (
          <GlossaryTooltip key={i} term={entry.term} definition={entry.definition}>
            {seg.text}
          </GlossaryTooltip>
        )
      })}
    </span>
  )
}

// Re-export so callers don't need to import from two places
export { GLOSSARY, buildGlossaryIndex }
