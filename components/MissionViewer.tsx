'use client'

import { useState, useEffect } from 'react'
import { Mission, MissionProgress, LessonProgress } from '@/lib/types'

interface MissionViewerProps {
  mission: Mission
}

export function MissionViewer({ mission }: MissionViewerProps) {
  const [selectedLesson, setSelectedLesson] = useState(0)
  const [progress, setProgress] = useState<MissionProgress | null>(null)

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`mission-progress-${mission.date}`)
    if (saved) {
      setProgress(JSON.parse(saved))
    } else {
      // Initialize progress
      const newProgress: MissionProgress = {
        missionDate: mission.date,
        lessonsProgress: mission.lessons.map((lesson, idx) => ({
          lessonIndex: idx,
          checklistCompleted: new Array(lesson.successChecklist.length).fill(false),
          notes: '',
        })),
        startedAt: new Date().toISOString(),
      }
      setProgress(newProgress)
    }
  }, [mission])

  // Save progress to localStorage
  useEffect(() => {
    if (progress) {
      localStorage.setItem(`mission-progress-${mission.date}`, JSON.stringify(progress))
    }
  }, [progress, mission.date])

  const currentLesson = mission.lessons[selectedLesson]
  const currentProgress = progress?.lessonsProgress[selectedLesson]

  const toggleCheckbox = (checkboxIndex: number) => {
    if (!progress || !currentProgress) return

    const newProgress = { ...progress }
    const lessonProgress = newProgress.lessonsProgress[selectedLesson]
    lessonProgress.checklistCompleted[checkboxIndex] = !lessonProgress.checklistCompleted[checkboxIndex]

    // Check if all checkboxes are completed
    const allCompleted = lessonProgress.checklistCompleted.every(c => c)
    if (allCompleted && !lessonProgress.completedAt) {
      lessonProgress.completedAt = new Date().toISOString()
    } else if (!allCompleted) {
      delete lessonProgress.completedAt
    }

    // Check if all lessons are completed
    const allLessonsCompleted = newProgress.lessonsProgress.every(lp =>
      lp.checklistCompleted.every(c => c)
    )
    if (allLessonsCompleted && !newProgress.completedAt) {
      newProgress.completedAt = new Date().toISOString()
    } else if (!allLessonsCompleted) {
      delete newProgress.completedAt
    }

    setProgress(newProgress)
  }

  const updateNotes = (notes: string) => {
    if (!progress) return

    const newProgress = { ...progress }
    newProgress.lessonsProgress[selectedLesson].notes = notes
    setProgress(newProgress)
  }

  const getCompletionPercentage = () => {
    if (!progress) return 0
    const totalCheckboxes = progress.lessonsProgress.reduce(
      (sum, lp) => sum + lp.checklistCompleted.length,
      0
    )
    const completedCheckboxes = progress.lessonsProgress.reduce(
      (sum, lp) => sum + lp.checklistCompleted.filter(c => c).length,
      0
    )
    return totalCheckboxes > 0 ? Math.round((completedCheckboxes / totalCheckboxes) * 100) : 0
  }

  if (!currentLesson || !currentProgress) {
    return <div>Loading...</div>
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎯 Today's Missions</h2>
            <p className="text-sm text-gray-500 mt-1">{mission.date}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall Progress</div>
            <div className="text-2xl font-bold text-purple-600">{completionPercentage}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Lesson tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-2 overflow-x-auto -mb-px">
          {mission.lessons.map((lesson, idx) => {
            const lessonProgress = progress?.lessonsProgress[idx]
            const isCompleted = lessonProgress?.checklistCompleted.every(c => c)
            const completedCount = lessonProgress?.checklistCompleted.filter(c => c).length || 0
            const totalCount = lessonProgress?.checklistCompleted.length || 0

            return (
              <button
                key={idx}
                onClick={() => setSelectedLesson(idx)}
                className={`px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedLesson === idx
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted && <span>✅</span>}
                  <span>Lesson {idx + 1}</span>
                  <span className="text-xs text-gray-400">
                    ({completedCount}/{totalCount})
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lesson content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{currentLesson.title}</h3>
        </div>

        {/* What you're building */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 What You're Building</h4>
          <div className="text-sm text-blue-800 whitespace-pre-wrap">{currentLesson.eli5}</div>
        </div>

        {/* What you'll have + Prerequisites */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">📚 Overview</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{currentLesson.whatYoureLearning}</div>
        </div>

        {/* Expected results */}
        {currentLesson.expectedResult.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🎯 You'll Have</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {currentLesson.expectedResult.map((result, idx) => (
                <li key={idx}>{result}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata & Prerequisites */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">ℹ️ Details & Prerequisites</h4>
          <div className="text-sm text-purple-800 whitespace-pre-wrap">{currentLesson.whereItFits}</div>
        </div>

        {/* Step-by-step walkthrough */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">🚀 Execute Through Claude Code</h4>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">{currentLesson.walkthrough}</pre>
          </div>
          <div className="mt-2 text-xs text-gray-500 italic">
            💡 Copy the commands above and paste them into Claude Code to execute step-by-step
          </div>
        </div>

        {/* Next steps */}
        {currentLesson.tryItExercise && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">🐰 Next Steps (Optional)</h4>
            <div className="text-sm text-green-800 whitespace-pre-wrap">{currentLesson.tryItExercise}</div>
          </div>
        )}

        {/* Success checklist */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">✅ Success Checklist</h4>
          <div className="space-y-2">
            {currentLesson.successChecklist.map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentProgress.checklistCompleted[idx] || false}
                  onChange={() => toggleCheckbox(idx)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span
                  className={`text-sm ${
                    currentProgress.checklistCompleted[idx]
                      ? 'text-gray-400 line-through'
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">📝 Your Notes</h4>
          <textarea
            value={currentProgress.notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Take notes as you work through this lesson..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            rows={4}
          />
        </div>

        {/* Rabbit holes */}
        <details className="border border-gray-200 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50">
            🐰 Optional Rabbit Holes
          </summary>
          <div className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-200">
            {currentLesson.rabbitHoles}
          </div>
        </details>
      </div>
    </div>
  )
}
