import { kv } from '@vercel/kv'
import { get } from '@vercel/edge-config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle URL shortening (existing functionality)
  if (pathname.startsWith('/s/')) {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const id = pathname.split('/').pop()
      const url = await kv.get(`fragment:${id}`)

      if (url) {
        return NextResponse.redirect(url as string)
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Handle welcome route (Edge Config example)
  if (pathname === '/welcome') {
    try {
      // Only try Edge Config if properly configured
      if (process.env.EDGE_CONFIG && process.env.EDGE_CONFIG.startsWith('https://')) {
        const greeting = await get('greeting');
        return NextResponse.json(greeting || { message: 'Welcome to CodingIT!' });
      } else {
        return NextResponse.json({ message: 'Welcome to CodingIT!' });
      }
    } catch (error) {
      console.warn('Edge Config not available, using fallback:', error);
      return NextResponse.json({ message: 'Welcome to CodingIT!' });
    }
  }

  // Handle Edge Config feature flags
  if (pathname.startsWith('/api/edge-flags')) {
    try {
      // Check if Edge Config is properly configured first
      if (!process.env.EDGE_CONFIG || !process.env.EDGE_CONFIG.startsWith('https://')) {
        return NextResponse.json({ 
          error: 'Edge Config not configured, use /api/flags instead',
          fallback: '/api/flags'
        }, { status: 503 });
      }

      // Get the GrowthBook client key from environment
      const clientKey = process.env.GROWTHBOOK_CLIENT_KEY;
      if (!clientKey) {
        return NextResponse.json({ error: 'GrowthBook client key not configured' }, { status: 500 });
      }

      // Try to get feature flags from Edge Config
      const edgeConfigData = await get(clientKey);
      
      if (edgeConfigData) {
        // Return the cached feature flags from Edge Config
        return NextResponse.json({
          source: 'edge-config',
          data: edgeConfigData,
          cached: true,
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback to fetching from GrowthBook API
        const apiEndpoint = process.env.GROWTHBOOK_API_ENDPOINT;
        if (!apiEndpoint) {
          return NextResponse.json({ error: 'GrowthBook API endpoint not configured' }, { status: 500 });
        }

        const response = await fetch(apiEndpoint);
        const apiData = await response.json();
        
        return NextResponse.json({
          source: 'growthbook-api',
          data: apiData,
          cached: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch feature flags',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }

  // Handle general Edge Config access
  if (pathname.startsWith('/edge-config/')) {
    const key = pathname.replace('/edge-config/', '');
    
    try {
      // Only try Edge Config if properly configured
      if (!process.env.EDGE_CONFIG || !process.env.EDGE_CONFIG.startsWith('https://')) {
        return NextResponse.json({ 
          error: 'Edge Config not configured',
          key,
          found: false,
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }

      const value = await get(key);
      return NextResponse.json({ 
        key,
        value,
        found: value !== undefined,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Import security function for safe logging
      const { sanitizeForLogging } = await import('./lib/security')
      const sanitizedKey = sanitizeForLogging(key)
      
      console.warn('Error fetching key from Edge Config:', {
        key: sanitizedKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return NextResponse.json({ 
        error: 'Failed to fetch configuration key',
        key,
        found: false,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/s/:path*',
    '/api/edge-flags/:path*',
    '/welcome',
    '/edge-config/:path*'
  ],
}