import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = request.headers.get('x-user-email')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 401 })
    }

    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('Error finding user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const updates = await request.json()

    // Validate the todo ID
    if (!id) {
      return NextResponse.json(
        { error: 'Todo ID is required' },
        { status: 400 }
      )
    }

    // Verify the todo belongs to the authenticated user
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found or access denied' },
        { status: 404 }
      )
    }

    // Update the todo
    const { data: updatedTodo, error } = await supabase
      .from('todos')
      .update({
        ...updates,
        is_completed: `${updates.is_completed}`?.trim() === 'true',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating todo:', error)
      return NextResponse.json(
        { error: 'Failed to update todo' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTodo)

  } catch (error) {
    console.error('Todo update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


