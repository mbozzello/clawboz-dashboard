import { Event } from '@/lib/types'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'

interface ActivityFeedProps {
  events: Event[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
        <p className="text-sm text-gray-500 mt-1">Recent events across all projects</p>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events yet
          </div>
        ) : (
          events.slice(0, 50).map((event, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {event.project}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{event.agent}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{event.message}</p>
                  {event.artifact && (
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                      📎 {event.artifact}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(event.ts || event.timestamp || '')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
