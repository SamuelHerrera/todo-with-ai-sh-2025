'use client'

import { useContext, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignInAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { authService, SignInData } from '@/services'
import { UserContext } from '@/hooks/user.hook'

export default function LoginPage() {
  const userCtx = useContext(UserContext);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const loginRequest = Object.fromEntries(formData.entries()) as unknown as SignInData
      const { user, token } = await authService.signIn(loginRequest)
      userCtx.setUser(user)
      userCtx.setToken(token)
    } catch (error) {
      console.warn('Error signing in:', error)
      setError(error instanceof Error ? error.message : 'Error signing in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Todo App</h1>
        <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
