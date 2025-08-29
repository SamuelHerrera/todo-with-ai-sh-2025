'use client'

import { createContext, useEffect, useState, useContext, useCallback, useMemo } from "react";
import type { Task } from '@/types/tasks'
import { taskService } from "@/services";
import { useRealtimeTasks } from './useRealtimeTasks'
import { UserContext } from './user.hook'
import { CreateTaskData, UpdateTaskData } from "@/types/task-service";

export const TasksContext = createContext<{
    tasks: Task[]
    setTasks: (tasks: Task[]) => void
    loading: {
        initial: boolean
        creating: boolean
        updating: boolean
        refreshing: boolean
    }
    error: string | null
    viewArchivedTasks: boolean
    setViewArchivedTasks: (viewArchivedTasks: boolean) => void
    setError: (error: string | null) => void
    refreshTasks: () => Promise<void>
    createTask: (taskData: CreateTaskData) => Promise<Task>
    updateTask: (taskId: string, updates: UpdateTaskData) => Promise<Task>

}>({
    tasks: [],
    setTasks: () => { },
    loading: {
        initial: false,
        creating: false,
        updating: false,
        refreshing: false
    },
    error: null,
    viewArchivedTasks: false,
    setViewArchivedTasks: () => { },
    setError: () => { },
    refreshTasks: async () => { },
    createTask: async () => ({} as Task),
    updateTask: async () => ({} as Task),

});

function TasksContextProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useContext(UserContext)
    const [viewArchivedTasks, setViewArchivedTasks] = useState(false)
    const [tasks, setTasks] = useState<Task[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState({
        initial: true,
        creating: false,
        updating: false,
        refreshing: false
    })

    // Memoize realtime handlers to prevent unnecessary re-renders
    const handleTaskInsert = useCallback((task: Task) => {
        setTasks(prev => {
            // Check if task already exists (from optimistic update)
            const existingIndex = prev.findIndex(t => t.id === task.id)
            if (existingIndex >= 0) {
                // Replace optimistic task with real one
                const newTasks = [...prev]
                newTasks[existingIndex] = task
                return newTasks
            } else {
                // Check if there's a temporary task that should be replaced
                const tempTaskIndex = prev.findIndex(t => t.id.startsWith('temp-'))
                if (tempTaskIndex >= 0) {
                    // Replace the temporary task with the real one
                    const newTasks = [...prev]
                    newTasks[tempTaskIndex] = task
                    return newTasks
                } else {
                    // Add new task at the beginning
                    return [task, ...prev]
                }
            }
        })
    }, [])

    const handleTaskUpdate = useCallback((task: Task) => {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t))
    }, [])

    const handleTaskDelete = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId))
    }, [])

    // Setup realtime subscription
    useRealtimeTasks({
        userEmail: user?.email || null,
        onTaskInsert: handleTaskInsert,
        onTaskUpdate: handleTaskUpdate,
        onTaskDelete: handleTaskDelete
    })

    const refreshTasks = useCallback(async () => {
        setLoading(prev => ({ ...prev, refreshing: true }))
        setError(null)

        try {
            if (!token) {
                throw new Error('No authentication token')
            }
            const fetchedTasks = await taskService.getTasks(token)
            setTasks(fetchedTasks.data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks'
            setError(errorMessage)
        } finally {
            setLoading(prev => ({ ...prev, refreshing: false }))
        }
    }, [token])

    const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task> => {
        setLoading(prev => ({ ...prev, creating: true }))
        setError(null)

        try {
            if (!token) {
                throw new Error('No authentication token')
            }
            const tempId = `temp-${Date.now()}-${Math.random()}`
            // Update local state optimistically with a temporary id
            const optimisticTask = { ...taskData, id: tempId } as Task
            setTasks(prev => [optimisticTask, ...prev])

            const newTask = await taskService.createTask(taskData, token)
            // The realtime subscription will handle the final update
            return newTask
        } catch (err) {
            // Remove optimistic task on error
            setTasks(prev => prev.filter(t => !t.id.startsWith('temp-')))
            const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
            setError(errorMessage)
            throw err
        } finally {
            setLoading(prev => ({ ...prev, creating: false }))
        }
    }, [token])

    const updateTask = useCallback(async (taskId: string, updates: UpdateTaskData): Promise<Task> => {
        setLoading(prev => ({ ...prev, updating: true }))
        setError(null)

        try {
            if (!token) {
                throw new Error('No authentication token')
            }
            // Update local state optimistically
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            ))

            const updatedTask = await taskService.updateTask(taskId, updates, token)
            // The realtime subscription will handle the final update
            return updatedTask
        } catch (err) {
            // Revert optimistic update on error
            refreshTasks()
            const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
            setError(errorMessage)
            throw err
        } finally {
            setLoading(prev => ({ ...prev, updating: false }))
        }
    }, [refreshTasks, token])



    useEffect(() => {
        const loadInitialTasks = async () => {
            setLoading(prev => ({ ...prev, initial: true }))
            setError(null)

            try {
                if (!token) {
                    throw new Error('No authentication token')
                }
                const fetchedTasks = await taskService.getTasks(token)
                setTasks(fetchedTasks.data)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks'
                setError(errorMessage)
            } finally {
                setLoading(prev => ({ ...prev, initial: false }))
            }
        }

        // Only load tasks if user is authenticated
        if (user) {
            loadInitialTasks()
        } else {
            setLoading(prev => ({ ...prev, initial: false }))
        }
    }, [user, token])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        viewArchivedTasks,
        setViewArchivedTasks,
        tasks,
        setTasks,
        loading,
        error,
        setError,
        refreshTasks,
        createTask,
        updateTask
    }), [
        viewArchivedTasks,
        tasks,
        loading,
        error,
        refreshTasks,
        createTask,
        updateTask
    ])

    return (
        <TasksContext.Provider value={contextValue}>
            {children}
        </TasksContext.Provider>
    )
}

export default TasksContextProvider;