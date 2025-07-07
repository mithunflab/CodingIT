import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 })
  }

  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    return new NextResponse(content)
  } catch (error) {
    return new NextResponse('File not found', { status: 404 })
  }
}

export async function POST(request: Request) {
  const { path: filePath, content } = await request.json()

  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 })
  }

  try {
    const fullPath = path.join(process.cwd(), filePath)
    fs.writeFileSync(fullPath, content, 'utf-8')
    return new NextResponse('File saved successfully')
  } catch (error) {
    return new NextResponse('Error saving file', { status: 500 })
  }
}
