import type { Task } from '@/types/tasks'
import type { CreateTaskData, UpdateTaskData, TaskFilters } from '@/types/task-service'
import { isEmptyString } from '@/lib/is-empty-string'

export const taskService = {
  async createTask(taskData: CreateTaskData, token: string): Promise<Task> {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create task')
    }

    return response.json()
  },
  async updateTask(taskId: string, updates: UpdateTaskData, token: string): Promise<Task> {
    const response = await fetch(`/api/todos/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update task')
    }

    return response.json()
  },

  async getTasks(token: string, filters?: TaskFilters): Promise<{ data: Task[], count: number }> {
    const params = new URLSearchParams()
    if (filters?.is_completed !== undefined) {
      params.append('is_completed', filters.is_completed.toString())
    }

    const url = `/api/todos${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }

    return response.json()
  },
  validateTaskData(taskData: CreateTaskData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (isEmptyString(taskData.title)) {
      errors.push('Task title is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },


}