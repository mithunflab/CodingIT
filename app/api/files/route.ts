import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface FileSystemNode {
  name: string
  isDirectory: boolean
  children?: FileSystemNode[]
}

function getFileTree(dir: string): FileSystemNode[] {
  const files = fs.readdirSync(dir)
  return files.map(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    const isDirectory = stat.isDirectory()
    const children = isDirectory ? getFileTree(filePath) : undefined
    return { name: file, isDirectory, children }
  })
}

export async function GET() {
  const projectRoot = process.cwd()
  const fileTree = getFileTree(projectRoot)
  return NextResponse.json(fileTree)
}
