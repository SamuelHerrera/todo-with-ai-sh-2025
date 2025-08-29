'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/tasks'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeTasksProps {
    userEmail: string | null
    onTaskInsert: (task: Task) => void
    onTaskUpdate: (task: Task) => void
    onTaskDelete: (taskId: string) => void
}

export function useRealtimeTasks({
    userEmail,
    onTaskInsert,
    onTaskUpdate,
    onTaskDelete
}: UseRealtimeTasksProps) {
    const subscriptionRef = useRef<RealtimeChannel | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const currentUserEmailRef = useRef<string | null>(null)
    const isConnectingRef = useRef(false)

    // Memoize the handlers to prevent unnecessary re-renders
    const handlers = useMemo(() => ({
        onTaskInsert,
        onTaskUpdate,
        onTaskDelete
    }), [onTaskInsert, onTaskUpdate, onTaskDelete])

    const setupSubscription = useCallback(async () => {
        if (!userEmail) return

        // Prevent duplicate subscriptions for the same user
        if (currentUserEmailRef.current === userEmail && subscriptionRef.current) {
            return
        }

        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current) {
            return
        }

        isConnectingRef.current = true

        try {
            // Clean up existing subscription
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current)
                subscriptionRef.current = null
            }

            // Get user_id from email
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', userEmail)
                .single()

            if (userError || !user) {
                console.error('Error finding user for realtime:', userError)
                return
            }

            currentUserEmailRef.current = userEmail

            // Subscribe to todos table changes for this user
            subscriptionRef.current = supabase
                .channel(`todos-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'todos',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        switch (payload.eventType) {
                            case 'INSERT':
                                handlers.onTaskInsert(payload.new as Task)
                                break
                            case 'UPDATE':
                                handlers.onTaskUpdate(payload.new as Task)
                                break
                            case 'DELETE':
                                handlers.onTaskDelete((payload.old as Task).id)
                                break
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('Realtime subscription status:', status)

                    // Handle reconnection for Vercel deployment
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.log('Realtime connection lost, attempting to reconnect...')
                        if (reconnectTimeoutRef.current) {
                            clearTimeout(reconnectTimeoutRef.current)
                        }
                        reconnectTimeoutRef.current = setTimeout(() => {
                            isConnectingRef.current = false
                            setupSubscription()
                        }, 3000) // Retry after 3 seconds
                    }
                })

        } catch (error) {
            console.error('Error setting up realtime subscription:', error)
            // Retry on error
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            reconnectTimeoutRef.current = setTimeout(() => {
                isConnectingRef.current = false
                setupSubscription()
            }, 5000) // Retry after 5 seconds
        } finally {
            isConnectingRef.current = false
        }
    }, [userEmail, handlers])

    useEffect(() => {
        setupSubscription()

        // Cleanup subscription on unmount or user change
        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current)
                subscriptionRef.current = null
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
            currentUserEmailRef.current = null
            isConnectingRef.current = false
        }
    }, [setupSubscription])
}
