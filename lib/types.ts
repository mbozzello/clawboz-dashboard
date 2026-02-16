export interface Event {
  ts?: string  // New format: UTC ISO timestamp
  timestamp?: string  // Legacy format: for backward compatibility
  project: string
  agent: string
  status: string
  message: string
  artifact?: string
  meta?: Record<string, any>
}

export interface Project {
  name: string
  description?: string
}

export interface ProjectsData {
  projects: Project[]
}

export interface AgentStatus {
  agent: string
  status: string
  message: string
  timestamp: string
  artifact?: string
}

export interface ProjectGroup {
  project: string
  agents: AgentStatus[]
  lastUpdated: string
}

// Mission types
export interface MissionLesson {
  title: string
  eli5: string
  whatYoureLearning: string
  expectedResult: string[]
  whereItFits: string
  walkthrough: string
  tryItExercise: string
  successChecklist: string[]
  rabbitHoles: string
  sourceUrl?: string
}

export interface Mission {
  date: string
  lessons: MissionLesson[]
  totalTime: string
}

export interface LessonProgress {
  lessonIndex: number
  checklistCompleted: boolean[]
  notes: string
  completedAt?: string
}

export interface MissionProgress {
  missionDate: string
  lessonsProgress: LessonProgress[]
  startedAt: string
  completedAt?: string
}
