'use client'

import { useContext, useState } from "react";
import { UserContext } from '@/hooks/user.hook';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt, faSpinner, faBoxArchive, faPersonRunning } from '@fortawesome/free-solid-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import TaskList from '@/components/TaskList'
import { isEmptyString } from "@/lib/is-empty-string";
import { TasksContext } from "@/hooks/tasks.hook";
import { taskService } from "@/services";
import type { CreateTaskData } from "@/types/task-service";

export default function App() {
  const userCtx = useContext(UserContext);
  const tasksCtx = useContext(TasksContext);
  // State for the empty task item
  const [taskTitle, setTaskTitle] = useState('')

  const handleAddTask = async () => {
    if (isEmptyString(taskTitle)) {
      return
    }

    let taskData = {} as CreateTaskData;

    try {
      // Validate task data
      taskData = {
        user_id: userCtx.user?.id || '',
        title: taskTitle.trim(),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as CreateTaskData;

      const validation = taskService.validateTaskData(taskData)
      if (!validation.isValid) {
        throw new Error(validation.errors[0])
      }

      // Reset the empty task form
      setTaskTitle('')

      await tasksCtx.createTask(taskData)

      setTimeout(() => {
        const taskTitleInput = document.getElementById('new-task-title') as HTMLInputElement
        if (taskTitleInput) {
          taskTitleInput.click()
          taskTitleInput.focus()
        }
      }, 100)

    } catch (error) {
      // Error is already handled in the context
      console.error('Error adding task:', error)
      setTaskTitle(taskData.title || '')
    }
  }

  const handleEmptyTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTask()
    }
  }

  if (userCtx.isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return <div className="w-full h-full">
    <div className="w-full h-[4rem] flex justify-between items-center px-4 border-b border-gray-300 bg-white shadow">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks {tasksCtx.viewArchivedTasks ? '+ Archived' : ''}</h1>
        <p className="text-gray-600">Welcome, {userCtx.user?.name}!</p>
      </div>
      <div className="flex gap-2 select-none">
        <div className="flex items-center gap-1 text-sm text-gray-500" title="Active">
          <FontAwesomeIcon icon={faPersonRunning} />
          <span> ({tasksCtx.tasks.filter(task => !task.is_completed).length})</span>
        </div>
        <button
          title="Archived"
          onClick={() => tasksCtx.setViewArchivedTasks(!tasksCtx.viewArchivedTasks)}
          className={`flex items-center gap-1 px-3 py-1 rounded-md ${tasksCtx.viewArchivedTasks
            ? ' text-white bg-purple-400 hover:bg-purple-500'
            : ' text-gray-500 hover:bg-gray-500 hover:text-white'}`}
        >
          <FontAwesomeIcon icon={faBoxArchive} />
          <span className="text-xs">({tasksCtx.tasks.filter(task => task.is_completed).length})</span>
        </button>
        <button
          title="Sign out"
          onClick={() => {
            userCtx.setUser(null)
            userCtx.setToken(null)
          }}
          className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </div>
    </div>

    <div className="w-full h-[calc(100%-4rem)]">
      {/* Error display */}
      {tasksCtx.error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {tasksCtx.error}
          <button
            onClick={() => tasksCtx.setError(null)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Empty task item - always present */}
      <div className="px-4 py-3">
        <div className="flex items-centergap-2 gap-2 bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-300 border-dashed">
          <input
            autoFocus
            id="new-task-title"
            type="text"
            autoComplete="off"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={handleEmptyTaskKeyPress}
            className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a new task..."
            disabled={tasksCtx.loading.creating}
          />
          <button
            onClick={handleAddTask}
            disabled={tasksCtx.loading.creating || isEmptyString(taskTitle)}
            className="flex items-center gap-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {tasksCtx.loading.creating ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPlus} />
            )}
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-90px)]">
        <TaskList />
      </div>
    </div>
  </div>;
}
