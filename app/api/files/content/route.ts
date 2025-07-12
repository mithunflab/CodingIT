import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Mock file content storage - in a real implementation this would integrate with project storage
const mockFileContents: Record<string, string> = {
  '/src/App.tsx': `import React from 'react'
import { Button } from './components/Button'
import { Card } from './components/Card'

function App() {
  return (
    <div className="app">
      <h1>Welcome to CodingIT</h1>
      <Card>
        <Button onClick={() => console.log('Hello!')}>
          Click me
        </Button>
      </Card>
    </div>
  )
}

export default App`,
  
  '/src/components/Button.tsx': `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      className={\`btn btn--\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,

  '/src/components/Card.tsx': `import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={\`card \${className}\`}>
      {children}
    </div>
  )
}`,

  '/src/utils/helpers.ts': `export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}`,

  '/package.json': `{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}`,

  '/README.md': `# My Project

This is a sample project created with CodingIT.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm run dev\`
3. Build for production: \`npm run build\`

## Features

- React with TypeScript
- Component-based architecture
- Utility functions
- Modern development setup

Happy coding! 🚀`
}

export async function GET(request: NextRequest) {
  try {
    // Skip authentication in development for now
    if (process.env.NODE_ENV === 'development') {
      const { searchParams } = new URL(request.url)
      const path = searchParams.get('path')
      
      if (!path) {
        return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
      }

      const content = mockFileContents[path] || `// File: ${path}\n// Content not found or empty file\n`
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }
    
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    // TODO: In a real implementation, fetch the actual file content from project storage
    const content = mockFileContents[path] || `// File: ${path}\n// Content not found or empty file\n`
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error fetching file content:', error)
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip authentication in development for now
    if (process.env.NODE_ENV === 'development') {
      const { path, content } = await request.json()
      
      if (!path || content === undefined) {
        return NextResponse.json(
          { error: 'Path and content are required' }, 
          { status: 400 }
        )
      }

      mockFileContents[path] = content
      
      return NextResponse.json({ success: true, message: 'File saved successfully' })
    }
    
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path, content } = await request.json()
    
    if (!path || content === undefined) {
      return NextResponse.json(
        { error: 'Path and content are required' }, 
        { status: 400 }
      )
    }

    // TODO: In a real implementation, save the file content to project storage
    mockFileContents[path] = content
    
    return NextResponse.json({ success: true, message: 'File saved successfully' })
  } catch (error) {
    console.error('Error saving file content:', error)
    return NextResponse.json({ error: 'Failed to save file content' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Skip authentication in development for now
    if (process.env.NODE_ENV === 'development') {
      const { searchParams } = new URL(request.url)
      const path = searchParams.get('path')
      
      if (!path) {
        return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
      }

      delete mockFileContents[path]
      
      return NextResponse.json({ success: true, message: 'File deleted successfully' })
    }
    
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    // TODO: In a real implementation, delete the file from project storage
    delete mockFileContents[path]
    
    return NextResponse.json({ success: true, message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}