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
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
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

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

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

    return stream.toTextStreamResponse()
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