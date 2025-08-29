export interface CreateTaskData {
    title: string
    description?: string | null
    is_completed?: boolean
}

export interface UpdateTaskData {
    title?: string
    description?: string | null
    is_completed?: boolean
}

export interface TaskFilters {
    is_completed?: boolean
}

