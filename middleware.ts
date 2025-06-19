import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestId = `mid_${crypto.randomUUID()}`
  const startTime = Date.now()

  console.log(`[Middleware ${requestId}] ${request.method} ${request.nextUrl.pathname}`)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedRoutes = ['/project', '/projects', '/settings', '/api-docs']
  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }

    
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type')
      
      
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
  
  
  response.headers.set('X-Request-ID', requestId)
  
  console.log(`[Middleware ${requestId}] Processed in ${Date.now() - startTime}ms`)
  
  return response
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|public|icons).*)',
  ],
}
