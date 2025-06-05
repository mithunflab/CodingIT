import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Enhanced request logging and validation
  const requestId = `mid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  console.log(`[Middleware ${requestId}] ${request.method} ${request.nextUrl.pathname}`)

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Enhanced CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Add request ID for tracking
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }

    // Enhanced request validation for API routes
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type')
      
      // Validate content type for specific endpoints
      if (request.nextUrl.pathname === '/api/chat') {
        if (!contentType?.includes('application/json')) {
          console.warn(`[Middleware ${requestId}] Invalid content type for /api/chat: ${contentType}`)
          return new Response(
            JSON.stringify({
              error: 'Invalid content type. Expected application/json',
              code: 'INVALID_CONTENT_TYPE',
              requestId
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }
      
      // Validate file upload endpoints
      if (request.nextUrl.pathname === '/api/project/analyze' || 
          request.nextUrl.pathname === '/api/upload-files') {
        if (!contentType?.includes('multipart/form-data')) {
          console.warn(`[Middleware ${requestId}] Invalid content type for file upload: ${contentType}`)
          return new Response(
            JSON.stringify({
              error: 'Invalid content type. Expected multipart/form-data',
              code: 'INVALID_CONTENT_TYPE',
              requestId
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }

    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    response.headers.set('X-Client-IP', clientIP)
    response.headers.set('X-Rate-Limit-Remaining', '100')
    
    return response
  }

  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://e2b.dev https://*.e2b.dev https://*.e2b.app",
    "worker-src 'self' blob:",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Add request tracking
  response.headers.set('X-Request-ID', requestId)
  
  console.log(`[Middleware ${requestId}] Processed in ${Date.now() - startTime}ms`)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|icons).*)',
  ],
}
