import { NextRequest, NextResponse } from 'next/server'
import { Sandbox, FileType } from '@e2b/code-interpreter'
import { FileSystemNode } from '@/components/file-tree'

async function listFilesRecursively(
  sandbox: Sandbox,
  path: string,
): Promise<FileSystemNode[]> {
  const files = await sandbox.files.list(path)
  const nodes: FileSystemNode[] = []

  for (const file of files) {
    const fullPath = `${path}/${file.name}`
    if (file.type === FileType.DIR) {
      nodes.push({
        name: file.name,
        isDirectory: true,
        children: await listFilesRecursively(sandbox, fullPath),
      })
    } else {
      nodes.push({
        name: file.name,
        isDirectory: false,
        path: fullPath,
      })
    }
  }
  return nodes
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sandboxId = searchParams.get('sandboxId')

  let sandbox: Sandbox | undefined

  try {
    if (sandboxId) {
      sandbox = await Sandbox.connect(sandboxId)
    } else {
      sandbox = await Sandbox.create('nextjs-developer')
    }

    const fileTree = await listFilesRecursively(sandbox, '/')
    
    // Only kill the sandbox if it was created in this request
    if (!sandboxId && sandbox) {
      await sandbox.kill()
    }

    return NextResponse.json(fileTree)
  } catch (error) {
    console.error('Error fetching file tree:', error)
    // Ensure sandbox is killed in case of an error during file listing
    if (!sandboxId && sandbox) {
      await sandbox.kill()
    }
    return NextResponse.json(
      { error: 'Failed to fetch file tree' },
      { status: 500 },
    )
  }
}
