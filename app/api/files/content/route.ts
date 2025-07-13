import { NextRequest, NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sandboxId = searchParams.get('sandboxId')
  const path = searchParams.get('path')

  if (!sandboxId || !path) {
    return NextResponse.json(
      { error: 'sandboxId and path are required' },
      { status: 400 },
    )
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId)
    const content = await sandbox.files.read(path)
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error fetching file content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const {
    sandboxId,
    path,
    content,
  }: { sandboxId: string; path: string; content: string } = await request.json()

  if (!sandboxId || !path || content === undefined) {
    return NextResponse.json(
      { error: 'sandboxId, path, and content are required' },
      { status: 400 },
    )
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId)
    await sandbox.files.write(path, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving file content:', error)
    return NextResponse.json(
      { error: 'Failed to save file content' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sandboxId = searchParams.get('sandboxId')
  const path = searchParams.get('path')

  if (!sandboxId || !path) {
    return NextResponse.json(
      { error: 'sandboxId and path are required' },
      { status: 400 },
    )
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId)
    await sandbox.files.remove(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 },
    )
  }
}
