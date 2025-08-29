// Type definitions for our database schema
export interface Task {
    id: string
    user_id: string
    title: string
    description: string | null
    is_completed: boolean
    created_at: string
    updated_at: string
  }