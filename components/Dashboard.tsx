'use client'

import { useState, useMemo } from 'react'
import { Event, ProjectGroup, AgentStatus } from '@/lib/types'
import { ProjectCard } from './ProjectCard'
import { ActivityFeed } from './ActivityFeed'
import { Filters } from './Filters'

interface DashboardProps {
  events: Event[]
}

export function Dashboard({ events }: DashboardProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Extract unique projects and statuses
  const { projects, statuses } = useMemo(() => {
    const projectSet = new Set<string>()
    const statusSet = new Set<string>()

    events.forEach((event) => {
      projectSet.add(event.project)
      statusSet.add(event.status)
    })

    return {
      projects: Array.from(projectSet).sort(),
      statuses: Array.from(statusSet).sort(),
    }
  }, [events])

  // Group events by project and get latest status per agent
  const projectGroups = useMemo(() => {
    const groups = new Map<string, Map<string, AgentStatus>>()

    // Process events (already sorted newest first)
    events.forEach((event) => {
      if (!groups.has(event.project)) {
        groups.set(event.project, new Map())
      }

      const projectAgents = groups.get(event.project)!

      // Only keep the latest event per agent
      if (!projectAgents.has(event.agent)) {
        const eventTime = event.ts || event.timestamp || new Date().toISOString()
        projectAgents.set(event.agent, {
          agent: event.agent,
          status: event.status,
          message: event.message,
          timestamp: eventTime,
          artifact: event.artifact,
        })
      }
    })

    // Convert to ProjectGroup array
    const result: ProjectGroup[] = []
    groups.forEach((agents, project) => {
      const agentArray = Array.from(agents.values())
      const lastUpdated = agentArray.reduce((latest, agent) => {
        return new Date(agent.timestamp) > new Date(latest)
          ? agent.timestamp
          : latest
      }, agentArray[0]?.timestamp || new Date().toISOString())

      result.push({
        project,
        agents: agentArray.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        lastUpdated,
      })
    })

    // Sort by last updated (newest first)
    return result.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
  }, [events])

  // Filter events and project groups
  const { filteredGroups, filteredEvents } = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()

    const filterEvent = (event: Event) => {
      if (selectedProject && event.project !== selectedProject) return false
      if (selectedStatus && event.status !== selectedStatus) return false
      if (searchQuery && !event.message.toLowerCase().includes(searchLower))
        return false
      return true
    }

    const filteredEvts = events.filter(filterEvent)

    const filteredGrps = projectGroups.filter((group) => {
      if (selectedProject && group.project !== selectedProject) return false
      if (selectedStatus) {
        const hasStatus = group.agents.some(
          (agent) => agent.status === selectedStatus
        )
        if (!hasStatus) return false
      }
      if (searchQuery) {
        const hasMatch = group.agents.some((agent) =>
          agent.message.toLowerCase().includes(searchLower)
        )
        if (!hasMatch) return false
      }
      return true
    })

    return { filteredGroups: filteredGrps, filteredEvents: filteredEvts }
  }, [events, projectGroups, selectedProject, selectedStatus, searchQuery])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Filters
        projects={projects}
        statuses={statuses}
        selectedProject={selectedProject}
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onProjectChange={setSelectedProject}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{events.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Active Agents</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {projectGroups.reduce((sum, g) => sum + g.agents.length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Filtered Results</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {filteredGroups.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Cards - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <p className="text-gray-500">No projects match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredGroups.map((group) => (
                <ProjectCard key={group.project} projectGroup={group} />
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed - 1 column */}
        <div className="lg:col-span-1">
          <ActivityFeed events={filteredEvents} />
        </div>
      </div>
    </div>
  )
}
