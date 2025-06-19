import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface CodeCompletionRequest {
  prompt: string
  context: string
  language: string
  file: string
  cursorPosition: { line: number; column: number }
  sandboxId?: string
}

// Stream AI code completions
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CodeCompletionRequest = await request.json()
    const { prompt, context, language, file, cursorPosition, sandboxId } = body

    if (!prompt || !context || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamCodeCompletion(
            { prompt, context, language, file, cursorPosition, sandboxId },
            (chunk: string) => {
              const data = encoder.encode(chunk)
              controller.enqueue(data)
            }
          )
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Code completion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code completion' },
      { status: 500 }
    )
  }
}

async function streamCodeCompletion(
  request: CodeCompletionRequest,
  onChunk: (chunk: string) => void
) {
  const { prompt, context, language, file, cursorPosition } = request

  // Get OpenAI API key from environment
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const lines = context.split('\n')
  const beforeCursor = lines.slice(0, cursorPosition.line - 1).join('\n')
  const currentLine = lines[cursorPosition.line - 1] || ''
  const afterCursor = lines.slice(cursorPosition.line).join('\n')

  const contextBefore = beforeCursor.split('\n').slice(-10).join('\n') // Last 10 lines
  const contextAfter = afterCursor.split('\n').slice(0, 5).join('\n') // Next 5 lines

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer and coding assistant. Help complete code based on the user's request and context.

**Instructions:**
1. Generate only the code completion/modification, not explanations
2. Follow ${language} best practices and conventions  
3. Ensure the code is production-ready and functional
4. Consider the existing code context and maintain consistency
5. Focus on clean, efficient, and maintainable code
6. Use modern ${language} features and patterns
7. Include proper error handling where appropriate
8. Follow naming conventions and code style
9. Optimize for performance and readability
10. Add comments only when necessary for complex logic

**Context:**
- File: ${file}
- Language: ${language}
- Cursor Position: Line ${cursorPosition.line}, Column ${cursorPosition.column}

**Code Context Before Cursor:**
\`\`\`${language}
${contextBefore}
\`\`\`

**Current Line:**
\`\`\`${language}
${currentLine}
\`\`\`

**Code Context After Cursor:**
\`\`\`${language}
${contextAfter}
\`\`\`

Generate the code completion/modification based on the user's request. Output only the code without markdown formatting or explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              
              if (content) {
                onChunk(content)
              }
            } catch (parseError) {
              // Ignore parsing errors for invalid JSON chunks
              continue
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

  } catch (error) {
    console.error('Streaming completion failed:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const prompt = searchParams.get('prompt')
  const language = searchParams.get('language') || ''

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt parameter' }, { status: 400 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completion = await generateSimpleCompletion(prompt, language)
    
    return NextResponse.json({ completion })

  } catch (error) {
    console.error('Simple completion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate completion' },
      { status: 500 }
    )
  }
}

async function generateSimpleCompletion(prompt: string, language: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer. Generate clean, production-ready code based on the user's request. Output only the code without explanations or markdown formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.choices[0]?.message?.content || ''

  } catch (error) {
    console.error('Simple completion failed:', error)
    throw error
  }
}
