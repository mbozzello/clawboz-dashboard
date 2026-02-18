import fs from 'fs'
import path from 'path'
import { isLocal, getMissionRawUrl } from './config'

const LOCAL_MISSIONS_DIR = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ParsedStep {
  number: number
  title: string
  description: string
  commands: string[]
  checklist: string[]
}

export interface ParsedSource {
  label: string
  url: string
}

export interface ParsedMission {
  index: number
  title: string
  slug: string
  timeEstimate: string
  difficulty: string
  tools: string
  description: string
  source: ParsedSource | null
  youllBuild: string[]
  prerequisites: string[]
  steps: ParsedStep[]
  successCriteria: string[]
  nextSteps: string[]
}

export interface MissionDetail {
  date: string
  missions: ParsedMission[]
  rawContent: string
}

/* ------------------------------------------------------------------ */
/* Slug                                                                */
/* ------------------------------------------------------------------ */

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/* ------------------------------------------------------------------ */
/* Fetch + parse a single date's mission file                          */
/* ------------------------------------------------------------------ */

export async function fetchMissionDetail(date: string): Promise<MissionDetail | null> {
  let content: string

  try {
    if (isLocal()) {
      const filePath = path.join(LOCAL_MISSIONS_DIR, `${date}.md`)
      if (!fs.existsSync(filePath)) return null
      content = fs.readFileSync(filePath, 'utf-8')
    } else {
      const res = await fetch(getMissionRawUrl(`${date}.md`), {
        next: { revalidate: 60 },
      })
      if (!res.ok) return null
      content = await res.text()
    }
  } catch {
    return null
  }

  const parsed = parseMissionMarkdown(content, date)
  return { ...parsed, rawContent: content }
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

export function parseMissionMarkdown(content: string, date: string): { date: string; missions: ParsedMission[] } {
  const missions: ParsedMission[] = []
  const sections = content.split(/^## Mission (\d+): (.+)$/gm)

  for (let i = 1; i < sections.length; i += 3) {
    const index = parseInt(sections[i], 10)
    const title = sections[i + 1]?.trim() || ''
    const body = sections[i + 2] || ''

    const timeEstimate = extractMeta(body, 'Time') || ''
    const difficulty = extractMeta(body, 'Difficulty') || ''
    const tools = extractMeta(body, 'Tools') || ''

    const descSection = between(body, "### \u{1F4A1} What You're Building", '###')
    const descLines = descSection.split('\n').filter((l: string) => l.trim() && !l.trim().startsWith('**'))
    const description = descLines.join(' ').trim()

    const source = parseSource(body)
    const youllBuild = bulletList(body, "**You'll have:**", '###')
    const prerequisites = bulletList(body, '### \u2705 Prerequisites', '###')
    const steps = parseSteps(body)
    const successCriteria = bulletList(body, '### \u{1F3AF} Success Criteria', '###')
    const nextSteps = bulletList(body, '### \u{1F430} Next Steps', '---')

    missions.push({
      index, title, slug: `${date}-${slugify(title)}`, timeEstimate, difficulty, tools,
      description, source, youllBuild, prerequisites, steps,
      successCriteria, nextSteps,
    })
  }

  return { date, missions }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function extractMeta(body: string, key: string): string {
  const re = new RegExp(`\\*\\*.*?${key}:?\\*\\* (.+)`, 'i')
  const m = body.match(re)
  return m ? m[1].trim() : ''
}

function between(body: string, start: string, end: string): string {
  const si = body.indexOf(start)
  if (si === -1) return ''
  const after = body.substring(si + start.length)
  const ei = after.indexOf(end)
  return ei === -1 ? after.trim() : after.substring(0, ei).trim()
}

function bulletList(body: string, start: string, end: string): string[] {
  const sec = between(body, start, end)
  return sec
    .split('\n')
    .filter((l: string) => l.trim().startsWith('-'))
    .map((l: string) => l.trim().replace(/^-\s*(\[.\]\s*)?/, '').trim())
}

function parseSource(body: string): ParsedSource | null {
  const m = body.match(/\*Inspired by:\s*(.+?)\*/)
  if (!m) return null

  const raw = m[1].trim()

  const hnMatch = raw.match(/^HackerNews:\s*(.+)$/i)
  if (hnMatch) {
    const title = hnMatch[1].trim()
    return { label: 'HackerNews', url: `https://www.google.com/search?q=site:news.ycombinator.com+${encodeURIComponent(title)}` }
  }

  const ghMatch = raw.match(/^GitHub Trending:\s*(.+)$/i)
  if (ghMatch) {
    const repo = ghMatch[1].trim()
    const isOwnerRepo = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)
    return { label: 'GitHub', url: isOwnerRepo ? `https://github.com/${repo}` : 'https://github.com/trending' }
  }

  const phMatch = raw.match(/^Product Hunt:\s*(.+)$/i)
  if (phMatch) {
    const name = phMatch[1].trim()
    return { label: 'Product Hunt', url: `https://www.producthunt.com/search?q=${encodeURIComponent(name)}` }
  }

  const xMatch = raw.match(/^X:\s*(.+)$/i)
  if (xMatch) {
    const term = xMatch[1].trim()
    return { label: 'X', url: `https://x.com/search?q=${encodeURIComponent(term)}&src=typed_query` }
  }

  // Named PM/blog sources with " - description" suffix
  // e.g. "Lenny's Newsletter - RICE scoring and ruthless prioritization frameworks"
  //      "Product Talk - Teresa Torres on continuous discovery"
  //      "Mind the Product - stakeholder communication"
  //      "Reforge - competitive intelligence as a core PM practice"
  //      "Product Coalition - strategy, feature prioritization"
  //      "Claude Code MCP SDK documentation - building persistent tools"
  const knownSources: Record<string, string> = {
    "lenny's newsletter": 'https://www.lennysnewsletter.com/',
    'lennys newsletter': 'https://www.lennysnewsletter.com/',
    'product talk': 'https://www.producttalk.org/',
    'mind the product': 'https://www.mindtheproduct.com/',
    'reforge': 'https://www.reforge.com/blog',
    'product coalition': 'https://productcoalition.com/',
    'claude code mcp sdk': 'https://docs.anthropic.com/en/docs/claude-code/mcp',
    'indie hackers': 'https://www.indiehackers.com/',
    'x (twitter)': 'https://x.com/',
  }
  const knownSourceMatch = raw.match(/^(.+?)\s*-\s*.+$/)
  if (knownSourceMatch) {
    const name = knownSourceMatch[1].trim()
    const key = name.toLowerCase()
    const url = Object.entries(knownSources).find(([k]) => key.includes(k))?.[1]
    return { label: name, url: url || `https://www.google.com/search?q=${encodeURIComponent(name)}` }
  }

  // Bare owner/repo pattern (with optional " - description" suffix)
  // e.g. "ruvnet/wifi-densepose - WiFi-based human pose estimation"
  const bareRepoMatch = raw.match(/^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)(?:\s*-\s*.+)?$/)
  if (bareRepoMatch) {
    const repo = bareRepoMatch[1].trim()
    return { label: 'GitHub', url: `https://github.com/${repo}` }
  }

  // Bare name with " - description" → treat as a web product, Google it
  // e.g. "Unblocked AI Code Review - context-aware PR reviews"
  //      "Wispr Flow - 4x faster voice dictation tool"
  const namedProductMatch = raw.match(/^(.+?)\s*-\s*.+$/)
  if (namedProductMatch) {
    const name = namedProductMatch[1].trim()
    return { label: name, url: `https://www.google.com/search?q=${encodeURIComponent(name)}` }
  }

  // Final fallback — show as label with no link
  return { label: raw, url: '' }
}

function parseSteps(body: string): ParsedStep[] {
  const steps: ParsedStep[] = []
  const stepsSection = between(body, '### \u{1F680} Step-by-Step Instructions', '### \u{1F3AF} Success Criteria')
  if (!stepsSection) return steps

  const parts = stepsSection.split(/^#### Step (\d+): (.+)$/gm)

  for (let i = 1; i < parts.length; i += 3) {
    const number = parseInt(parts[i], 10)
    const title = parts[i + 1]?.trim() || ''
    const stepBody = parts[i + 2] || ''

    const descLine = stepBody.split('\n').find((l: string) =>
      l.trim() && !l.trim().startsWith('```') && !l.trim().startsWith('#') && !l.trim().startsWith('**')
    )
    const description = descLine?.trim() || ''

    const codeMatch = stepBody.match(/```(?:bash)?\n([\s\S]*?)```/)
    const commands = codeMatch
      ? codeMatch[1].split('\n').filter((l: string) => l.trim())
      : []

    const checklist = stepBody
      .split('\n')
      .filter((l: string) => l.trim().startsWith('- ['))
      .map((l: string) => l.trim().replace(/^-\s*\[.\]\s*/, '').trim())

    steps.push({ number, title, description, commands, checklist })
  }

  return steps
}
