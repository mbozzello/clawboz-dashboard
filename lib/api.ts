import { Event, ProjectsData } from './types'
import { getEventsUrl, getProjectsUrl } from './config'

export async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch(getEventsUrl(), {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const text = await response.text()

    // Parse JSONL (one JSON object per line)
    const lines = text.trim().split('\n').filter(line => line.trim())
    const events: Event[] = lines.map(line => JSON.parse(line))

    // Sort by timestamp descending (newest first)
    // Handle both "ts" (new) and "timestamp" (legacy) fields
    return events.sort((a, b) => {
      const timeA = a.ts || a.timestamp || ''
      const timeB = b.ts || b.timestamp || ''
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export async function fetchProjects(): Promise<ProjectsData> {
  try {
    const response = await fetch(getProjectsUrl(), {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { projects: [] }
  }
}
