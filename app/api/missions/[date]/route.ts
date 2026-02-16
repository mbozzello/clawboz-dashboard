import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isLocal, getMissionRawUrl } from '@/lib/config'

const LOCAL_MISSIONS_DIR = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')

// GET /api/missions/[date] — read + parse one mission file
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    let content: string

    if (isLocal()) {
      const filePath = path.join(LOCAL_MISSIONS_DIR, `${date}.md`)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
      }
      content = fs.readFileSync(filePath, 'utf-8')
    } else {
      const res = await fetch(getMissionRawUrl(`${date}.md`), {
        next: { revalidate: 60 },
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
      }
      content = await res.text()
    }

    const parsed = parseMissionMarkdown(content, date)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error reading mission:', error)
    return NextResponse.json({ error: 'Failed to read mission' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

interface ParsedStep {
  number: number
  title: string
  description: string
  commands: string[]
  checklist: string[]
}

interface ParsedMission {
  index: number
  title: string
  timeEstimate: string
  difficulty: string
  tools: string
  description: string
  youllBuild: string[]
  prerequisites: string[]
  steps: ParsedStep[]
  successCriteria: string[]
  nextSteps: string[]
}

function parseMissionMarkdown(content: string, date: string) {
  const missions: ParsedMission[] = []
  const sections = content.split(/^## Mission (\d+): (.+)$/gm)

  for (let i = 1; i < sections.length; i += 3) {
    const index = parseInt(sections[i], 10)
    const title = sections[i + 1]?.trim() || ''
    const body = sections[i + 2] || ''

    const timeEstimate = extractMeta(body, 'Time') || ''
    const difficulty = extractMeta(body, 'Difficulty') || ''
    const tools = extractMeta(body, 'Tools') || ''

    const descSection = between(body, "### 💡 What You're Building", '###')
    const descLines = descSection.split('\n').filter(l => l.trim() && !l.trim().startsWith('**'))
    const description = descLines.join(' ').trim()

    const youllBuild = bulletList(body, "**You'll have:**", '###')
    const prerequisites = bulletList(body, '### ✅ Prerequisites', '###')
    const steps = parseSteps(body)
    const successCriteria = bulletList(body, '### 🎯 Success Criteria', '###')
    const nextSteps = bulletList(body, '### 🐰 Next Steps', '---')

    missions.push({
      index, title, timeEstimate, difficulty, tools,
      description, youllBuild, prerequisites, steps,
      successCriteria, nextSteps,
    })
  }

  return { date, missions }
}

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
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.trim().replace(/^-\s*(\[.\]\s*)?/, '').trim())
}

function parseSteps(body: string): ParsedStep[] {
  const steps: ParsedStep[] = []
  const stepsSection = between(body, '### 🚀 Step-by-Step Instructions', '### 🎯 Success Criteria')
  if (!stepsSection) return steps

  const parts = stepsSection.split(/^#### Step (\d+): (.+)$/gm)

  for (let i = 1; i < parts.length; i += 3) {
    const number = parseInt(parts[i], 10)
    const title = parts[i + 1]?.trim() || ''
    const stepBody = parts[i + 2] || ''

    const descLine = stepBody.split('\n').find(l =>
      l.trim() && !l.trim().startsWith('```') && !l.trim().startsWith('#') && !l.trim().startsWith('**')
    )
    const description = descLine?.trim() || ''

    const codeMatch = stepBody.match(/```(?:bash)?\n([\s\S]*?)```/)
    const commands = codeMatch
      ? codeMatch[1].split('\n').filter(l => l.trim())
      : []

    const checklist = stepBody
      .split('\n')
      .filter(l => l.trim().startsWith('- ['))
      .map(l => l.trim().replace(/^-\s*\[.\]\s*/, '').trim())

    steps.push({ number, title, description, commands, checklist })
  }

  return steps
}
