import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    let user

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check user existence' },
        { status: 500 }
      )
    }

    if (existingUser) {
      // User exists
      user = existingUser
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            name: email.split('@')[0] // Use email prefix as name
          }
        ])
        .select('id, email, name')
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      user = newUser
    }

    // Fetch user's todos
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (todosError) {
      console.error('Error fetching todos:', todosError)
      return NextResponse.json(
        { error: 'Failed to fetch todos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user,
      todos: todos || [],
      token: user.email // Return email as the bearer token
    })

  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
