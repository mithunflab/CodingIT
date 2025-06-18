import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GitHubIntegration } from '@/lib/github-integration'


export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies() 
    const githubToken = cookieStore.get('github_token')?.value

    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 401 })
    }

    const { owner, repo, path, content, message, sha, branch } = await req.json()

    if (!owner || !repo || !path || typeof content !== 'string' || !message) {
      return NextResponse.json({ error: 'Missing required parameters: owner, repo, path, content, message' }, { status: 400 })
    }

    const github = new GitHubIntegration(githubToken)
    const result = await github.createOrUpdateFile(owner, repo, path, content, message, sha, branch)

    if (result) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Failed to create or update file in GitHub' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error in PUT /api/github/contents:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies() 
    const githubToken = cookieStore.get('github_token')?.value

    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 401 })
    }

    const { owner, repo, path, message, sha, branch } = await req.json()

    if (!owner || !repo || !path || !message || !sha) {
      return NextResponse.json({ error: 'Missing required parameters: owner, repo, path, message, sha' }, { status: 400 })
    }

    const github = new GitHubIntegration(githubToken)
    const success = await github.deleteFile(owner, repo, path, message, sha, branch)

    if (success) {
      return NextResponse.json({ message: 'File deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to delete file in GitHub' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error in DELETE /api/github/contents:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
