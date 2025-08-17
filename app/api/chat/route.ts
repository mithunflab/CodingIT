import { Duration } from '@/lib/duration'
import {
  getModelClient,
  getDefaultModelParams,
  LLMModel,
  LLMModelConfig,
} from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'
import { ChatPersistence } from '@/lib/chat-persistence'
import { createServerClient } from '@/lib/supabase-server'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
    sessionId,
    saveToHistory = true,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
    sessionId?: string
    saveToHistory?: boolean
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  console.log('userID', userID)
  console.log('teamID', teamID)
  console.log('model', model)
  console.log('sessionId', sessionId)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = await getModelClient(model, config)

  // Save user message to history if enabled and user is authenticated
  let currentSessionId = sessionId
  if (saveToHistory && userID) {
    try {
      // Get the last user message from the messages array
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // Create new session if no sessionId provided
        if (!currentSessionId) {
          const session = await ChatPersistence.createSession(
            userID,
            teamID,
            {
              role: 'user',
              content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
              model: model.id,
              template: template.toString(),
              metadata: {
                userID,
                teamID,
              }
            }
          )
          currentSessionId = session.sessionId
        } else {
          // Add message to existing session
          await ChatPersistence.addMessage(userID, currentSessionId, {
            role: 'user',
            content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
            model: model.id,
            template: template.toString(),
            metadata: {
              userID,
              teamID,
            }
          })
        }
      }
    } catch (historyError) {
      console.error('Failed to save user message to history:', historyError)
      // Continue with request even if history save fails
    }
  }

  try {
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      system: toPrompt(template),
      messages,
      maxRetries: 0,
      ...getDefaultModelParams(model),
      ...modelParams,
    })

    // Create response with session handling
    const response = stream.toTextStreamResponse()
    
    // Add session ID to response headers if we created one
    if (currentSessionId && currentSessionId !== sessionId) {
      response.headers.set('X-Session-Id', currentSessionId)
    }

    // Note: Assistant response saving will be implemented in a future update
    // when we have better streaming completion handling

    return response
  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error?.message,
      status: error?.statusCode,
      provider: model,
      stack: error?.stack
    })

    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit') || error.message.includes('rate'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401 || error.message.includes('unauthorized') || error.message.includes('invalid') && error.message.includes('key'))
    const isModelError = 
      error && (error.statusCode === 404 || error.message.includes('not found') || error.message.includes('model'))
    const isNetworkError = 
      error && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('network'))

    if (isRateLimitError) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later or use your own API key.',
          type: 'rate_limit',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        },
      )
    }

    if (isOverloadedError) {
      return new Response(
        JSON.stringify({ 
          error: 'The AI service is currently overloaded. Please try again in a few moments.',
          type: 'service_overload',
          retryAfter: 30
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        },
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key or access denied. Please check your API key configuration.',
          type: 'auth_error'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        },
      )
    }

    if (isModelError) {
      return new Response(
        JSON.stringify({ 
          error: 'The selected AI model is not available. Please try a different model.',
          type: 'model_error'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        },
      )
    }

    if (isNetworkError) {
      return new Response(
        JSON.stringify({ 
          error: 'Network connection failed. Please check your internet connection and try again.',
          type: 'network_error'
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again. If the problem persists, try using a different AI model.',
        type: 'unknown_error',
        details: error?.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      },
    )
  }
}