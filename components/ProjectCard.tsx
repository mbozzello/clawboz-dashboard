import { ProjectGroup } from '@/lib/types'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'

interface ProjectCardProps {
  projectGroup: ProjectGroup
}

export function ProjectCard({ projectGroup }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {projectGroup.project}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Last updated {formatRelativeTime(projectGroup.lastUpdated)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {projectGroup.agents.length} agent{projectGroup.agents.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {projectGroup.agents.map((agent, idx) => (
            <div
              key={`${agent.agent}-${idx}`}
              className="flex items-start gap-3 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {agent.agent}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {agent.message}
                </p>
                {agent.artifact && (
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    📎 {agent.artifact}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(agent.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
