import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const state = url.searchParams.get('state') // GitHub returns state here
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GitHub Authentication</title>
      </head>
      <body>
        <script>
          if (window.opener) {
            if (${error ? `true` : `false`}) { // Check if error exists
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_ERROR', 
                error: '${error}',
                errorDescription: '${errorDescription}' 
              }, '*');
            } else if (${code ? `true` : `false`}) { // Check if code exists
              // Send code and state to parent window
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_CALLBACK', // New message type
                code: '${code}',
                state: '${state}' 
              }, '*');
            } else {
              // Fallback error if neither code nor error is present
              window.opener.postMessage({
                type: 'GITHUB_AUTH_ERROR',
                error: 'unknown_error',
                errorDescription: 'No authorization code or error returned from GitHub.'
              }, '*');
            }
          }
          // Always close the window after attempting to post message
          // Give a slight delay for the message to be potentially processed
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
