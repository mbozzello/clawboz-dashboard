'use client'

import { useState } from 'react'

interface FiltersProps {
  projects: string[]
  statuses: string[]
  selectedProject: string
  selectedStatus: string
  searchQuery: string
  onProjectChange: (project: string) => void
  onStatusChange: (status: string) => void
  onSearchChange: (query: string) => void
}

export function Filters({
  projects,
  statuses,
  selectedProject,
  selectedStatus,
  searchQuery,
  onProjectChange,
  onStatusChange,
  onSearchChange,
}: FiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Filter */}
        <div>
          <label
            htmlFor="project-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project
          </label>
          <select
            id="project-filter"
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onStatusChange('')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                selectedStatus === ''
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {statuses.slice(0, 4).map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
