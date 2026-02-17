/**
 * AI-powered mission generator.
 * Takes trending content, feeds it to Claude, gets practical project missions.
 * Works on both local and Vercel.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { TrendSource } from './trend-fetcher'
import { GITHUB_USERNAME, DATA_REPO, DATA_BRANCH } from './config'

/**
 * Load API key — process.env first, then .env.local fallback.
 * Turbopack sometimes doesn't inject .env.local into server routes.
 */
function getAnthropicKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY

  // Fallback: read .env.local directly
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const match = line.match(/^ANTHROPIC_API_KEY=(.+)/)
        if (match) return match[1].trim()
      }
    }
  } catch {}

  return undefined
}

export interface GeneratedMission {
  title: string
  description: string
  time_estimate: string
  difficulty: string
  tools: string[]
  what_youll_build: string[]
  prerequisites: string[]
  steps: {
    title: string
    description: string
    commands: string[]
    checklist: string[]
  }[]
  success_criteria: string[]
  next_steps: string[]
  inspiration_source: string
}

const SYSTEM_PROMPT = `You are ClawBoz Trend Coach — an AI that creates practical, hands-on project missions for developers. You analyze what's trending across the tech world and turn those trends into concrete "build this" missions that someone can execute through Claude Code in under an hour.

Rules:
- Every mission must result in something WORKING — not just reading docs
- Commands must be real, executable bash commands
- Focus on: MCP servers, AI integrations, automations, developer tools, productivity hacks
- Each mission should feel like "wow, I didn't know I could build that"
- Titles should be action-oriented: "Build X to do Y" or "Connect X to Y"
- Steps should be specific enough that Claude Code can execute them
- Include real package names, real APIs, real tools
- Make it feel like learning from a friend who just built something cool, not a textbook`

export async function generateMissionsFromTrends(
  trends: TrendSource[],
  count: number = 3
): Promise<{ missions: GeneratedMission[]; markdown: string }> {

  const apiKey = getAnthropicKey()
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured. Add it to Vercel Environment Variables (Settings → Environment Variables) or to your local .env file.')
  }

  const client = new Anthropic({ apiKey })

  // Build trend summary
  const trendSummary = trends
    .map(t => `## ${t.name}\nSource: ${t.url}\n${t.content}`)
    .join('\n\n---\n\n')

  const userPrompt = `Here's what's trending across the web RIGHT NOW:

${trendSummary}

Based on these real trends, generate exactly ${count} practical, hands-on project missions.

Each mission MUST:
1. Be inspired by something SPECIFIC from the trends above
2. Be completable in 30-60 minutes
3. Have real, executable commands (not placeholders like <tool-name>)
4. Result in a working tool/integration/automation
5. Be something you can tell Claude Code to build step-by-step

For each mission, return a JSON object with:
- title: "Build X to Do Y" format (concise, exciting)
- description: One compelling sentence
- time_estimate: e.g. "30-45 minutes"
- difficulty: "beginner" | "intermediate" | "advanced"
- tools: Array of specific tools/packages needed
- what_youll_build: 4 concrete deliverables
- prerequisites: 2-3 things needed to start
- steps: Array of 4-5 steps, each with:
  - title: Step name
  - description: What you're doing
  - commands: Array of real bash commands to run
  - checklist: Array of 3 things to verify this step worked
- success_criteria: 4 checkboxes for overall completion
- next_steps: 3-4 ways to extend the project
- inspiration_source: Which trend/source inspired this

Return ONLY a JSON array. No markdown, no explanation, no code fences.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Parse response
  let responseText = ''
  for (const block of message.content) {
    if (block.type === 'text') {
      responseText += block.text
    }
  }

  // Clean up potential markdown fences
  responseText = responseText.trim()
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const missions: GeneratedMission[] = JSON.parse(responseText)

  // Generate markdown
  const markdown = buildMarkdown(missions)

  return { missions, markdown }
}

function buildMarkdown(missions: GeneratedMission[]): string {
  const date = new Date().toISOString().split('T')[0]

  const lines: string[] = [
    `# 🎯 ClawBoz Project Missions - ${date}\n`,
    `**Today's hands-on projects:** ${missions.length} practical missions\n`,
    `**Sources:** Product Hunt, HackerNews, GitHub Trending, Cursor Changelog\n`,
    `**Difficulty:** Mix of beginner to advanced\n`,
    `\n---\n`,
  ]

  missions.forEach((m, idx) => {
    lines.push(`\n## Mission ${idx + 1}: ${m.title}\n`)
    lines.push(`**⏱️ Time:** ${m.time_estimate}  `)
    lines.push(`**📊 Difficulty:** ${m.difficulty.charAt(0).toUpperCase() + m.difficulty.slice(1)}  `)
    lines.push(`**🛠️ Tools:** ${m.tools.join(', ')}\n`)

    lines.push(`\n### 💡 What You're Building\n`)
    lines.push(`${m.description}\n`)
    lines.push(`\n**You'll have:**`)
    m.what_youll_build.forEach(item => lines.push(`- ${item}`))

    lines.push(`\n### ✅ Prerequisites\n`)
    m.prerequisites.forEach(item => lines.push(`- ${item}`))

    lines.push(`\n### 🚀 Step-by-Step Instructions\n`)
    lines.push(`**Execute these steps through Claude Code:**\n`)

    m.steps.forEach((step, si) => {
      lines.push(`\n#### Step ${si + 1}: ${step.title}\n`)
      lines.push(`${step.description}\n`)
      if (step.commands.length > 0) {
        lines.push('```bash')
        step.commands.forEach(cmd => lines.push(cmd))
        lines.push('```\n')
      }
      lines.push(`**Success Checklist:**`)
      step.checklist.forEach(item => lines.push(`- [ ] ${item}`))
      lines.push('')
    })

    lines.push(`\n### 🎯 Success Criteria\n`)
    m.success_criteria.forEach(item => lines.push(`- [ ] ${item}`))

    lines.push(`\n### 🐰 Next Steps (Optional)\n`)
    lines.push(`Once you've completed the basics, try:\n`)
    m.next_steps.forEach(item => lines.push(`- ${item}`))

    if (m.inspiration_source) {
      lines.push(`\n*Inspired by: ${m.inspiration_source}*`)
    }

    lines.push(`\n---`)
  })

  return lines.join('\n')
}

/**
 * Commit a mission markdown file to GitHub so Vercel can read it.
 */
export async function commitMissionToGitHub(
  markdown: string,
  date: string
): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.warn('GITHUB_TOKEN not set — cannot commit to GitHub')
    return false
  }

  const path = `missions/${date}.md`
  const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${DATA_REPO}/contents/${path}`

  // Check if file already exists (need SHA for update)
  let sha: string | undefined
  try {
    const existingRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    if (existingRes.ok) {
      const existing = await existingRes.json()
      sha = existing.sha
    }
  } catch {}

  // Create or update file
  const body: Record<string, any> = {
    message: `Update missions ${date}`,
    content: Buffer.from(markdown).toString('base64'),
    branch: DATA_BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('GitHub commit failed:', err)
    return false
  }

  return true
}
