import type { User } from '@/types/user'

export interface AuthResponse {
  user: User
  todos: unknown[]
  token: string
}

export interface SignInData {
  email: string
}

export const authService = {
  async signIn(signInData: SignInData): Promise<AuthResponse> {
    const validation = validateSignInData(signInData)
    if (!validation.isValid) {
      throw new Error(validation.errors[0])
    }
    const response = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify(signInData),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to sign in')
    }
    return response.json()
  },
}

function validateSignInData(signInData: SignInData): { isValid: boolean; errors: string[] } {
  console.log('validateSignInData', signInData['email'])
  const errors: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!signInData.email) {
    errors.push('Email is required')
  } else if (!emailRegex.test(signInData.email)) {
    errors.push('Please enter a valid email address')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}