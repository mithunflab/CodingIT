import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


interface ChatRequest {
  message: string
  context: {
    file: string
    content: string
    language: string
    selection?: string
    cursorPosition: { line: number; column: number }
  }
  history: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    codeContext?: {
      file: string
      lines: number[]
      selection?: string
    }
  }>
  sandboxId?: string
}

interface ChatResponse {
  message: string
  codeBlocks?: {
    language: string
    code: string
    description: string
    line?: number
  }[]
}

// Enhanced AI chat for developers
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body: ChatRequest = await request.json()
    const { message, context, history, sandboxId } = body

    if (!message || !context) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate AI response with context
    const response = await generateContextualResponse(
      message,
      context,
      history,
      sandboxId,
    )

    // Store chat interaction for learning
    await storeChatInteraction(user.id, {
      message,
      response: response.message,
      context,
      timestamp: new Date()
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

async function generateContextualResponse(
  message: string,
  context: ChatRequest['context'],
  history: ChatRequest['history'],
  sandboxId?: string,
): Promise<ChatResponse> {
  const { file, content, language, selection, cursorPosition } = context

  const systemPrompt = `You are an expert coding assistant specializing in ${language} development. You help developers write better code, debug issues, explain concepts, and optimize performance.

**Current Context:**
- File: ${file}
- Language: ${language}
- Sandbox ID: ${sandboxId || 'Not available'}
- Cursor Position: Line ${cursorPosition.line}, Column ${cursorPosition.column}
${selection ? `- Selected Code: "${selection}"` : ''}

**Capabilities:**
1. **Code Analysis**: Analyze and explain code functionality
2. **Debugging**: Help identify and fix bugs
3. **Optimization**: Suggest performance improvements
4. **Refactoring**: Recommend code structure improvements
5. **Best Practices**: Ensure adherence to ${language} conventions
6. **Documentation**: Generate comments and documentation
7. **Testing**: Suggest test cases and testing strategies
8. **Security**: Identify potential security vulnerabilities

**Guidelines:**
- Always consider the current code context in your responses
- Provide practical, actionable advice
- Include code examples when helpful
- Explain your reasoning for suggestions
- Focus on production-ready solutions
- Consider performance and maintainability
- Follow ${language} best practices and conventions

**Response Format:**
- Provide clear, helpful answers
- Include code snippets with proper formatting when relevant
- Suggest specific improvements with line numbers when applicable
- Offer multiple solutions when appropriate

Current code context:
\`\`\`${language}
${content}
\`\`\`

The user is asking about this code. Help them effectively.`

  // Build conversation history for context
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(h => ({
      role: h.role,
      content: h.role === 'user' ? 
        (h.codeContext ? `[Context: ${h.codeContext.file}${h.codeContext.selection ? `, Selected: "${h.codeContext.selection}"` : ''}]\n${h.content}` : h.content) :
        h.content
    })),
    { role: 'user', content: message }
  ]

  try {
    const response = await fetch('/api/ai/enhance-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textToEnhance: message,
        context: { file, content, language, selection, cursorPosition },
        history: messages,
        sandboxId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Enhance Text API error: ${response.statusText}`)
    }

    const result = await response.json()
    const enhancedText = result.enhancedText

    if (!enhancedText) {
      throw new Error('No enhanced text from AI')
    }

    // Extract code blocks from response if any
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g
    let match
    const codeBlocks: ChatResponse['codeBlocks'] = []
    while ((match = codeBlockRegex.exec(enhancedText)) !== null) {
      codeBlocks.push({
        language: match[1],
        code: match[2].trim(),
        description: 'Code example from response'
      })
    }

    return {
      message: enhancedText,
      codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined
    }

  } catch (error) {
    console.error('AI response generation failed:', error)
    
    // Fallback response
    return {
      message: "I'm having trouble processing your request right now. Could you please try rephrasing your question or check if there are any syntax errors in your code?",
    }
  }
}

async function storeChatInteraction(
  userId: string,
  interaction: {
    message: string
    response: string
    context: ChatRequest['context']
    timestamp: Date
  }
) {
  try {
    const { error } = await supabase
      .from('chat_interactions')
      .insert({
        user_id: userId,
        message: interaction.message,
        response: interaction.response,
        context: interaction.context,
        created_at: interaction.timestamp.toISOString()
      })

    if (error) {
      console.error('Failed to store chat interaction:', error)
    }
  } catch (error) {
    console.error('Error storing chat interaction:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('chat_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({ interactions: data })

  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
