import { createAnthropic } from '@ai-sdk/anthropic'
import { createFireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
  isBeta?: boolean
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export async function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey, baseURL } = config

  const providerConfigs = {
    anthropic: () => createAnthropic({ apiKey, baseURL })(modelNameString),
    openai: () => createOpenAI({ apiKey, baseURL })(modelNameString),
    google: () =>
      createGoogleGenerativeAI({ apiKey, baseURL })(modelNameString),
    mistral: () => createMistral({ apiKey, baseURL })(modelNameString),
    groq: () =>
      createOpenAI({
        apiKey: apiKey || process.env.GROQ_API_KEY,
        baseURL: baseURL || 'https://api.groq.com/openai/v1',
      })(modelNameString),
    togetherai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.TOGETHER_API_KEY,
        baseURL: baseURL || 'https://api.together.xyz/v1',
      })(modelNameString),
    ollama: () => createOllama({ baseURL })(modelNameString),
    fireworks: () =>
      createFireworks({
        apiKey: apiKey || process.env.FIREWORKS_API_KEY,
        baseURL: baseURL || 'https://api.fireworks.ai/inference/v1',
      })(modelNameString),
    vertex: () =>
      createVertex({
        googleAuthOptions: {
          credentials: JSON.parse(
            process.env.GOOGLE_VERTEX_CREDENTIALS || '{}',
          ),
        },
      })(modelNameString),
    xai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.XAI_API_KEY,
        baseURL: baseURL || 'https://api.x.ai/v1',
      })(modelNameString),
    deepseek: () =>
      createOpenAI({
        apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
        baseURL: baseURL || 'https://api.deepseek.com/v1',
      })(modelNameString),
  }

  const { validateProviderId } = await import('./security')
  
  if (!validateProviderId(providerId)) {
    throw new Error(`Invalid or unsupported provider: ${providerId}`)
  }

  switch (providerId) {
    case 'openai':
      return providerConfigs.openai()
    case 'anthropic':
      return providerConfigs.anthropic()
    case 'google':
      return providerConfigs.google()
    case 'vertex':
      return providerConfigs.vertex()
    case 'mistral':
      return providerConfigs.mistral()
    case 'groq':
      return providerConfigs.groq()
    case 'fireworks':
      return providerConfigs.fireworks()
    case 'togetherai':
      return providerConfigs.togetherai()
    case 'xai':
      return providerConfigs.xai()
    case 'deepseek':
      return providerConfigs.deepseek()
    case 'ollama':
      return providerConfigs.ollama()
    default:
      throw new Error(`Unsupported provider: ${providerId}`)
  }
}

export function getDefaultModelParams(model: LLMModel) {
  const { id: modelNameString } = model

  if (modelNameString.startsWith('gpt-5')) {
    return {
      temperature: 1,
    }
  }

  return {}
}