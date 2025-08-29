'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faCheckSquare, faSquare } from '@fortawesome/free-regular-svg-icons'
import { faTimes, faSpinner, faClock } from '@fortawesome/free-solid-svg-icons'
import type { Task } from '@/types/tasks'
import { useRelativeTime } from '@/hooks/useRelativeTime'

interface TaskItemProps {
  task: Task
  isEditing: boolean
  editingTitle: string
  editingDescription: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onEditKeyPress: (e: React.KeyboardEvent) => void
  onSaveEditing: () => void
  onCancelEditing: () => void
  onTaskComplete: (task: Task) => void
  onStartEditing: (task: Task) => void
  isLoading?: boolean
}

export default function TaskItem({
  task,
  isEditing,
  editingTitle,
  editingDescription,
  onTitleChange,
  onDescriptionChange,
  onEditKeyPress,
  onSaveEditing,
  onCancelEditing,
  onTaskComplete,
  onStartEditing,
  isLoading = false
}: TaskItemProps) {
  const updatedRelativeTime = useRelativeTime(task.updated_at)
  return (
    <div
      onDoubleClick={() => !isLoading && onStartEditing(task)}
      className={`bg-white rounded-lg shadow-md p-3 border-l-4 ${task.is_completed ? 'border-purple-500 bg-purple-50' : 'border-blue-500'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            // Editing mode
            <div className="space-y-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={onEditKeyPress}
                className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Title"
                autoFocus
                disabled={isLoading}
              />
              <textarea
                value={editingDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                onKeyDown={onEditKeyPress}
                rows={2}
                className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Description"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <button
                  onClick={onSaveEditing}
                  disabled={!editingTitle.trim() || isLoading}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faSave} />
                  )}
                  Save
                </button>
                <button
                  onClick={onCancelEditing}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div

              className={`rounded ${isLoading ? 'cursor-not-allowed' : ''}`}
            >
              <h4 className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className={`mt-1 text-sm ${task.is_completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}
              <div className="text-xs text-gray-400 flex gap-2">
                <div className="flex items-center gap-1" title={`Updated ${new Date(task.updated_at).toLocaleString()}`}>
                  <FontAwesomeIcon icon={faClock} />
                  {updatedRelativeTime || '...'}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <button
            title={task.is_completed ? 'Mark as active' : 'Mark as completed'}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onTaskComplete(task)
            }}
            className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon
              icon={task.is_completed ? faCheckSquare : faSquare}
              className={`text-lg ${task.is_completed ? 'text-purple-600' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
