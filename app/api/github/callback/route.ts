import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const state = url.searchParams.get('state')
  
  const sanitize = (value: string | null): string => {
    if (!value) return ''
    return value
      .replace(/[<>"/&']/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          '/': '&#x2F;',
          '&': '&amp;',
          "'": '&#x27;'
        }
        return entities[char] || char
      })
  }

  const sanitizedError = sanitize(error)
  const sanitizedErrorDescription = sanitize(errorDescription)
  const sanitizedCode = sanitize(code)
  const sanitizedState = sanitize(state)
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GitHub Authentication</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline';">
      </head>
      <body>
        <script>
          (function() {
            'use strict';
            
            if (window.opener) {
              const hasError = ${error ? 'true' : 'false'};
              const hasCode = ${code ? 'true' : 'false'};
              
              if (hasError) { 
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_ERROR', 
                  error: ${JSON.stringify(sanitizedError)},
                  errorDescription: ${JSON.stringify(sanitizedErrorDescription)}
                }, window.location.origin);
              } else if (hasCode) { 
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_CALLBACK', 
                  code: ${JSON.stringify(sanitizedCode)},
                  state: ${JSON.stringify(sanitizedState)}
                }, window.location.origin);
              } else {
                window.opener.postMessage({
                  type: 'GITHUB_AUTH_ERROR',
                  error: 'unknown_error',
                  errorDescription: 'No authorization code or error returned from GitHub.'
                }, window.location.origin);
              }
            }
            
            setTimeout(function() { 
              window.close(); 
            }, 1000);
          })();
        </script>
        <div style="text-align: center; font-family: system-ui, sans-serif; padding: 2rem;">
          <h2>Processing GitHub authentication...</h2>
          <p>You can close this window if it doesn't close automatically.</p>
        </div>
      </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    },
  })
}
