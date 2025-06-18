import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const state = url.searchParams.get('state') 
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GitHub Authentication</title>
      </head>
      <body>
        <script>
          if (window.opener) {
            if (${error ? `true` : `false`}) { 
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_ERROR', 
                error: '${error}',
                errorDescription: '${errorDescription}' 
              }, '*');
            } else if (${code ? `true` : `false`}) { 
              
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_CALLBACK', 
                code: '${code}',
                state: '${state}' 
              }, '*');
            } else {
              
              window.opener.postMessage({
                type: 'GITHUB_AUTH_ERROR',
                error: 'unknown_error',
                errorDescription: 'No authorization code or error returned from GitHub.'
              }, '*');
            }
          }
          
          
          setTimeout(() => { window.close(); }, 500);
        </script>
        <p>Processing GitHub authentication...</p>
        <p>You can close this window if it doesn't close automatically.</p>
      </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
