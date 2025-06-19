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
  suggestions?: {
    type: 'code' | 'refactor' | 'explain' | 'debug'
    content: string
    description: string
  }[]
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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const { file, content, language, selection, cursorPosition } = context

  // Build context-aware system prompt
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_code',
              description: 'Analyze code for issues, optimizations, or explanations',
              parameters: {
                type: 'object',
                properties: {
                  analysis_type: {
                    type: 'string',
                    enum: ['debug', 'optimize', 'explain', 'refactor', 'security'],
                    description: 'Type of code analysis to perform'
                  },
                  code_snippet: {
                    type: 'string',
                    description: 'The code snippet to analyze'
                  },
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        description: { type: 'string' },
                        code: { type: 'string' },
                        line: { type: 'number' }
                      }
                    }
                  }
                },
                required: ['analysis_type', 'code_snippet']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'generate_code',
              description: 'Generate new code based on requirements',
              parameters: {
                type: 'object',
                properties: {
                  requirement: {
                    type: 'string',
                    description: 'What the code should accomplish'
                  },
                  language: {
                    type: 'string',
                    description: 'Programming language for the code'
                  },
                  code: {
                    type: 'string',
                    description: 'The generated code'
                  },
                  explanation: {
                    type: 'string',
                    description: 'Explanation of how the code works'
                  }
                },
                required: ['requirement', 'language', 'code']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    const assistantMessage = result.choices[0]?.message

    if (!assistantMessage) {
      throw new Error('No response from AI')
    }

    // Process function calls if any
    const toolCalls = assistantMessage.tool_calls
    let responseMessage = assistantMessage.content || ''
    let suggestions: ChatResponse['suggestions'] = []
    let codeBlocks: ChatResponse['codeBlocks'] = []

    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        if (functionName === 'analyze_code') {
          suggestions.push({
            type: functionArgs.analysis_type,
            content: functionArgs.code_snippet,
            description: `Code analysis: ${functionArgs.analysis_type}`
          })

          if (functionArgs.suggestions) {
            suggestions.push(...functionArgs.suggestions.map((s: any) => ({
              type: s.type,
              content: s.code,
              description: s.description
            })))
          }
        } else if (functionName === 'generate_code') {
          codeBlocks.push({
            language: functionArgs.language,
            code: functionArgs.code,
            description: functionArgs.explanation || functionArgs.requirement
          })
        }
      }
    }

    // Extract code blocks from response if any
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g
    let match
    while ((match = codeBlockRegex.exec(responseMessage)) !== null) {
      codeBlocks.push({
        language: match[1],
        code: match[2].trim(),
        description: 'Code example from response'
      })
    }

    return {
      message: responseMessage,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined
    }

  } catch (error) {
    console.error('AI response generation failed:', error)
    
    // Fallback response
    return {
      message: "I'm having trouble processing your request right now. Could you please try rephrasing your question or check if there are any syntax errors in your code?",
      suggestions: [{
        type: 'debug',
        content: 'Check for syntax errors and ensure your code follows proper formatting',
        description: 'Basic debugging suggestion'
      }]
    }
  }
}

async function executeInSandbox(sandboxId: string | undefined, command: string): Promise<string> {
  if (!sandboxId) {
    return 'Error: Sandbox ID not provided.'
  }

  // This is a placeholder for actual sandbox execution logic.
  // In a real implementation, you would make an API call to your sandbox service.
  console.log(`Executing command in sandbox ${sandboxId}: ${command}`)
  
  // Simulate a command execution
  if (command.startsWith('ls')) {
    return 'file1.txt\nfile2.js\nnode_modules/'
  } else if (command.startsWith('cat')) {
    return `Content of ${command.split(' ')[1]}`
  } else if (command.startsWith('npm install')) {
    return 'Successfully installed packages.'
  }

  return `Command executed: ${command}`
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
