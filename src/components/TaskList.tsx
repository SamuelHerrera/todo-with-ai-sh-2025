'use client'

import type { Task } from '@/types/tasks'
import { useContext, useState } from 'react'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { isEmptyString } from '@/lib/is-empty-string'
import { TasksContext } from '@/hooks/tasks.hook'
import TaskItem from './TaskItem'
import LoadingSpinner from './LoadingSpinner'

export default function TaskList() {
  const tasksCtx = useContext(TasksContext);

  // State for editing tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  // Separate tasks into active and completed using the service
  const activeTasks = tasksCtx.tasks.filter((task) => {
    return !task.is_completed
  });

  const taskCount = (tasksCtx.viewArchivedTasks ? tasksCtx.tasks : activeTasks).length

  const handleTaskComplete = async (task: Task) => {
    try {
      await tasksCtx.updateTask(task.id, { is_completed: !task.is_completed })
    } catch (error) {
      // Error is already handled in the context
      console.error('Error completing task:', error)
    }
  }

  const handleStartEditing = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setEditingDescription(task.description || '')
  }

  const handleCancelEditing = () => {
    setEditingTaskId(null)
    setEditingTitle('')
    setEditingDescription('')
  }

  const handleSaveEditing = async () => {
    if (!editingTaskId || isEmptyString(editingTitle)) {
      return
    }

    try {
      await tasksCtx.updateTask(editingTaskId, {
        title: editingTitle.trim(),
        description: editingDescription.trim() || null
      })
      handleCancelEditing()
    } catch (error) {
      // Error is already handled in the context
      console.error('Error saving task:', error)
    }
  }

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEditing()
    } else if (e.key === 'Escape') {
      handleCancelEditing()
    }
  }



  // Show loading state for initial load
  if (tasksCtx.loading.initial) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading tasks..." />
      </div>
    )
  }

  return (
    <OverlayScrollbarsComponent className="h-full w-full overflow-hidden" options={{
      scrollbars: {
        autoHide: 'leave',
        theme: 'os-theme-dark',
      },
    }} defer>
      <div className="flex flex-col gap-4 px-4">
        {/* Active Tasks Section */}
        <div className="space-y-4">
          {tasksCtx.loading.refreshing && (
            <div className="flex items-center justify-between">
              <LoadingSpinner size="sm" />
            </div>
          )}
          {taskCount > 0 ? (
            <div className="space-y-3 [&>*:last-child]:mb-3">
              {[...(tasksCtx.viewArchivedTasks
                ? tasksCtx.tasks
                : activeTasks)].map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isEditing={editingTaskId === task.id}
                    editingTitle={editingTitle}
                    editingDescription={editingDescription}
                    onTitleChange={setEditingTitle}
                    onDescriptionChange={setEditingDescription}
                    onEditKeyPress={handleEditKeyPress}
                    onSaveEditing={handleSaveEditing}
                    onCancelEditing={handleCancelEditing}
                    onTaskComplete={handleTaskComplete}
                    onStartEditing={handleStartEditing}
                    isLoading={tasksCtx.loading.updating}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Add a task above to get started!
            </div>
          )}
        </div>
      </div>
    </OverlayScrollbarsComponent>
  )
}
