import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip authentication for the auth endpoint
  if (request.nextUrl.pathname === '/api/auth') {
    return NextResponse.next()
  }

  // Check for bearer token in Authorization header
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Bearer token is required' },
      { status: 401 }
    )
  }

  // Extract the token (email) from the bearer token
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(token)) {
    return NextResponse.json(
      { error: 'Invalid token format' },
      { status: 401 }
    )
  }

  // Add the user email to the request headers for use in API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-email', token)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: '/api/:path*',
}
