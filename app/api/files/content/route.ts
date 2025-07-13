import { NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'

const E2B_API_KEY = process.env.E2B_API_KEY
if (!E2B_API_KEY) {
  throw new Error('E2B_API_KEY environment variable not found')
}

const sandboxTimeout = 10 * 60 * 1000

async function getSandbox(sessionID: string) {
  const sandbox = await Sandbox.create({
    apiKey: E2B_API_KEY,
    metadata: {
      sessionID,
    },
    timeoutMs: sandboxTimeout,
  })
  return sandbox
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionID = searchParams.get('sessionID')
    const path = searchParams.get('path')

    if (!sessionID || !path) {
      return NextResponse.json(
        { error: 'sessionID and path are required' },
        { status: 400 },
      )
    }

    const sandbox = await getSandbox(sessionID)
    const content = await sandbox.files.read(path)
    return NextResponse.json({ content })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const { sessionID, path, content } = await req.json()

    if (!sessionID || !path || content === undefined) {
      return NextResponse.json(
        { error: 'sessionID, path and content are required' },
        { status: 400 },
      )
    }

    const sandbox = await getSandbox(sessionID)
    await sandbox.files.write(path, content)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
