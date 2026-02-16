import fs from 'fs'
import path from 'path'
import { Mission, MissionLesson } from './types'

export async function getLatestMission(): Promise<Mission | null> {
  try {
    const missionsDir = path.join(process.env.HOME || '', 'ClawBoz', 'clawboz-trend-coach', 'outputs', 'missions')

    if (!fs.existsSync(missionsDir)) {
      return null
    }

    // Get all mission files
    const files = fs.readdirSync(missionsDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()

    if (files.length === 0) {
      return null
    }

    // Read the latest mission file
    const latestFile = files[0]
    const filePath = path.join(missionsDir, latestFile)
    const content = fs.readFileSync(filePath, 'utf-8')

    // Parse the markdown content
    const mission = parseMissionMarkdown(content)
    mission.date = latestFile.replace('.md', '').replace('missions/', '')

    return mission
  } catch (error) {
    console.error('Error fetching latest mission:', error)
    return null
  }
}

function parseMissionMarkdown(content: string): Mission {
  const lessons: MissionLesson[] = []

  // Extract total time from header
  const timeMatch = content.match(/\*\*Time estimate:\*\* (.+)/i)
  const totalTime = timeMatch ? timeMatch[1] : '2-3 hours'

  // Split by mission sections (## Mission X:)
  const missionSections = content.split(/^## Mission \d+: (.+)$/gm)

  // Skip first element (header before first mission)
  for (let i = 1; i < missionSections.length; i += 2) {
    const title = missionSections[i].trim()
    const body = missionSections[i + 1] || ''

    // Extract metadata
    const timeEstimate = extractMeta(body, 'Time')
    const difficulty = extractMeta(body, 'Difficulty')
    const tools = extractMeta(body, 'Tools')

    const lesson: MissionLesson = {
      title,
      eli5: extractSection(body, '### 💡 What You\'re Building', '###'),
      whatYoureLearning: extractWhatYoullHave(body),
      expectedResult: extractBulletList(body, '**You\'ll have:**', '###'),
      whereItFits: `**⏱️ Time:** ${timeEstimate}\n**📊 Difficulty:** ${difficulty}\n**🛠️ Tools:** ${tools}\n\n` + extractSection(body, '### ✅ Prerequisites', '###'),
      walkthrough: extractSteps(body),
      tryItExercise: extractSection(body, '### 🐰 Next Steps (Optional)', '###'),
      successChecklist: extractAllCheckboxes(body),
      rabbitHoles: extractSection(body, '### 🐰 Next Steps (Optional)', '---'),
      sourceUrl: undefined,
    }

    lessons.push(lesson)
  }

  return {
    date: '',
    lessons,
    totalTime,
  }
}

function extractMeta(content: string, key: string): string {
  const regex = new RegExp(`\\*\\*.*?${key}:?\\*\\* (.+)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}

function extractSection(content: string, startMarker: string, endMarker: string): string {
  const startIdx = content.indexOf(startMarker)
  if (startIdx === -1) return ''

  const afterStart = content.substring(startIdx + startMarker.length)
  const endIdx = afterStart.indexOf(endMarker)

  const section = endIdx === -1
    ? afterStart
    : afterStart.substring(0, endIdx)

  return section.trim()
}

function extractWhatYoullHave(content: string): string {
  const section = extractSection(content, '### 💡 What You\'re Building', '**You\'ll have:**')
  const bulletsSection = extractSection(content, '**You\'ll have:**', '### ✅ Prerequisites')
  return section + '\n\n**You\'ll have:**\n' + bulletsSection
}

function extractBulletList(content: string, startMarker: string, endMarker: string): string[] {
  const section = extractSection(content, startMarker, endMarker)
  return section
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().substring(1).trim())
}

function extractSteps(content: string): string {
  const stepsSection = extractSection(content, '### 🚀 Step-by-Step Instructions', '### 🎯 Success Criteria')
  return stepsSection
}

function extractAllCheckboxes(content: string): string[] {
  const checkboxes: string[] = []

  // Extract from each step's success checklist
  const stepMatches = content.matchAll(/\*\*Success Checklist:\*\*\n((?:- \[ \] .+\n?)+)/g)
  for (const match of stepMatches) {
    const items = match[1]
      .split('\n')
      .filter(line => line.trim().match(/^- \[ \]/))
      .map(line => line.trim().replace(/^- \[ \] /, ''))
    checkboxes.push(...items)
  }

  // Also extract from Success Criteria section
  const criteriaSection = extractSection(content, '### 🎯 Success Criteria', '###')
  const criteriaItems = criteriaSection
    .split('\n')
    .filter(line => line.trim().match(/^- \[ \]/))
    .map(line => line.trim().replace(/^- \[ \] /, ''))

  checkboxes.push(...criteriaItems)

  return checkboxes
}
