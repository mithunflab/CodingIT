import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent('GitHub authentication failed')}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent('Missing authorization code')}`, request.url)
    )
  }

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('User not authenticated')}`, request.url)
      )
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData.error)
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Failed to exchange authorization code')}`, request.url)
      )
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const githubUser = await userResponse.json()

    if (!userResponse.ok) {
      console.error('GitHub user fetch error:', githubUser)
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Failed to fetch user information')}`, request.url)
      )
    }

    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        service_name: 'github',
        is_connected: true,
        connection_data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          github_user_id: githubUser.id,
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          connected_at: new Date().toISOString(),
        },
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Failed to save integration')}`, request.url)
      )
    }

    try {
      await setupWebhooks(tokenData.access_token, githubUser.login)
    } catch (webhookError) {
      console.warn('Webhook setup failed:', webhookError)
    }

    return NextResponse.redirect(
      new URL('/settings/integrations?success=github_connected', request.url)
    )
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent('Internal server error')}`, request.url)
    )
  }
}

async function setupWebhooks(accessToken: string, username: string) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/github`
  
  const reposResponse = await fetch(`https://api.github.com/user/repos?type=owner&per_page=10`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (reposResponse.ok) {
    const repos = await reposResponse.json()
    
    for (const repo of repos.slice(0, 3)) {
      try {
        await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request', 'issues'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              insecure_ssl: '0',
              secret: process.env.GITHUB_WEBHOOK_SECRET,
            },
          }),
        })
      } catch (error) {
        console.warn(`Failed to setup webhook for ${repo.full_name}:`, error)
      }
    }
  }
}
