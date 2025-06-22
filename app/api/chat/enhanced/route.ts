import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { autoProjectCreation } from '@/lib/services/auto-project-creation'
import { nanoid } from 'nanoid'
import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatRequest {
  message: string
  chatSessionId?: string
  projectId?: string
  messages?: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatSessionId, projectId, messages = [] }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate chat session ID if not provided
    const sessionId = chatSessionId || nanoid()
    let currentProjectId = projectId
    let autoCreatedProject = null

    // Check if this is a first-time prompt and should auto-create a project
    if (!currentProjectId) {
      try {
        autoCreatedProject = await autoProjectCreation.handleFirstTimePrompt(
          message,
          sessionId,
          user.id
        )
        
        if (autoCreatedProject) {
          currentProjectId = autoCreatedProject.id
          console.log(`Auto-created project: ${currentProjectId}`)
        }
      } catch (error) {
        console.error('Error in auto project creation:', error)
        // Continue with chat even if project creation fails
      }
    }

    // Prepare conversation context
    const conversationMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant specialized in web development and coding. You help users build applications using modern frameworks like Next.js, React, Vue.js, Streamlit, and Gradio.

${autoCreatedProject ? `
IMPORTANT: You have automatically created a new project for this user:
- Project Name: ${autoCreatedProject.title}
- Framework: ${autoCreatedProject.framework}
- Project ID: ${autoCreatedProject.id}

The project has been initialized with a basic structure. You should acknowledge the project creation and guide the user on next steps for their ${autoCreatedProject.framework} application.
` : ''}

Always provide:
1. Clear, actionable coding advice
2. Complete, production-ready code examples
3. Best practices and optimization suggestions
4. Framework-specific guidance when applicable

Maintain a helpful, professional tone and ensure all code follows modern standards.`
      },
      ...messages,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ]

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    })

    const assistantResponse = completion.choices[0]?.message?.content

    if (!assistantResponse) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Save chat messages to database
    const chatData = {
      session_id: sessionId,
      user_id: user.id,
      project_id: currentProjectId,
      messages: [
        ...conversationMessages.slice(1), // Exclude system message
        {
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date().toISOString()
        }
      ]
    }

    // Insert or update chat session
    const { error: chatError } = await supabase
      .from('chat_sessions')
      .upsert(chatData, {
        onConflict: 'session_id'
      })

    if (chatError) {
      console.error('Failed to save chat session:', chatError)
    }

    // Update project with latest activity if project exists
    if (currentProjectId) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          updated_at: new Date().toISOString(),
          last_activity: 'chat_interaction'
        })
        .eq('id', currentProjectId)

      if (updateError) {
        console.error('Failed to update project activity:', updateError)
      }
    }

    // Prepare response
    const response = {
      message: assistantResponse,
      chatSessionId: sessionId,
      projectId: currentProjectId,
      autoCreatedProject: autoCreatedProject ? {
        id: autoCreatedProject.id,
        title: autoCreatedProject.title,
        framework: autoCreatedProject.framework,
        description: autoCreatedProject.description
      } : null,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in enhanced chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const projectId = searchParams.get('projectId')

    if (!sessionId && !projectId) {
      return NextResponse.json(
        { error: 'Session ID or Project ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: chatSessions, error: queryError } = await query.order('created_at', { ascending: false })

    if (queryError) {
      throw queryError
    }

    return NextResponse.json({
      sessions: chatSessions || [],
      count: chatSessions?.length || 0
    })

  } catch (error) {
    console.error('Error retrieving chat history:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    )
  }
}
