import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email')

  if (!userEmail) {
    return NextResponse.json({ error: 'User email is required' }, { status: 401 })
  }

  // First, find the user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail?.toLowerCase())
    .single()

  if (userError || !user) {
    console.error('Error finding user:', userError)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const completedFilter = request.nextUrl.searchParams.get('completedStatus') || 'all'; // completed, pending, all

  // Build the query based on the completedFilter
  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)

  // Apply filter based on completedFilter value
  if (completedFilter === 'completed') {
    query = query.eq('is_completed', true)
  } else if (completedFilter === 'pending') {
    query = query.eq('is_completed', false)
  }
  // If completedFilter is 'all', no additional filter is applied

  // Add ordering
  const { data: todos, error: todosError, } = await query.order('created_at', { ascending: false })

  if (todosError) {
    console.error('Error fetching todos:', todosError)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }

  return NextResponse.json({ data: todos, count: todos.length })
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 401 })
    }

    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail?.toLowerCase())
      .single()

    if (userError || !user) {
      console.error('Error finding user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title, description } = await request.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create the todo
    const { data: newTodo, error } = await supabase
      .from('todos')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          is_completed: false
        }
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating todo:', error)
      return NextResponse.json(
        { error: 'Failed to create todo' },
        { status: 500 }
      )
    }

    // Trigger n8n workflow for task enhancement (non-blocking)
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nWebhookUrl) {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: newTodo.id,
            title: title,
            userId: user.id,
            userEmail: user.email
          }),
        }).then(response => {
          console.log('n8n workflow triggered', response)
        }).catch(error => {
          console.error('Failed to trigger n8n workflow:', error)
        })
      }
    } catch (error) {
      console.error('Error triggering n8n workflow:', error)
      // Don't fail the task creation if n8n trigger fails
    }

    return NextResponse.json(newTodo)

  } catch (error) {
    console.error('Todo creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
