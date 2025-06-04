export interface ModelPreset {
  name: string
  temperature: number
  topP: number
  topK?: number
  maxTokens: number
  frequencyPenalty: number
  presencePenalty: number
}

export const MODEL_PRESETS: Record<string, ModelPreset> = {
  production: {
    name: "Production Code",
    temperature: 0.1,
    topP: 0.9,
    topK: 40,
    maxTokens: 6000,
    frequencyPenalty: 0.2,
    presencePenalty: 0.0
  },
  
  analysis: {
    name: "Code Analysis",
    temperature: 0.05,
    topP: 0.85,
    topK: 30,
    maxTokens: 4000,
    frequencyPenalty: 0.1,
    presencePenalty: 0.0
  },
  
  creative: {
    name: "Creative Design",
    temperature: 0.3,
    topP: 0.95,
    topK: 50,
    maxTokens: 6000,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },
  
  prototype: {
    name: "Fast Prototype",
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
    maxTokens: 4000,
    frequencyPenalty: 0.15,
    presencePenalty: 0.05
  }
}

export const PROVIDER_DEFAULTS: Record<string, Partial<ModelPreset>> = {
  openai: {
    temperature: 0.1,
    topP: 0.9,
    maxTokens: 6000,
    frequencyPenalty: 0.2,
    presencePenalty: 0.0
  },
  
  anthropic: {
    temperature: 0.2,
    topP: 0.95,
    topK: 40,
    maxTokens: 6000,
    frequencyPenalty: 0.1,
    presencePenalty: 0.0
  },
  
  google: {
    temperature: 0.1,
    topP: 0.9,
    topK: 40,
    maxTokens: 8000,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  },
  
  vertex: {
    temperature: 0.1,
    topP: 0.9,
    topK: 40,
    maxTokens: 8000,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  },
  
  ollama: {
    temperature: 0.1,
    topP: 0.9,
    topK: 40,
    maxTokens: 4000,
    frequencyPenalty: 0.1,
    presencePenalty: 0.0
  }
}

export function getOptimalSettings(
  providerId: string, 
  useCase: keyof typeof MODEL_PRESETS = 'production'
): Partial<ModelPreset> {
  const preset = MODEL_PRESETS[useCase]
  const providerDefaults = PROVIDER_DEFAULTS[providerId] || {}
  
  return {
    ...preset,
    ...providerDefaults
  }
}

export function getDefaultModelConfig(providerId: string): Partial<ModelPreset> {
  const optimalSettings = getOptimalSettings(providerId, 'production')
  
  return {
    temperature: optimalSettings.temperature,
    topP: optimalSettings.topP,
    topK: optimalSettings.topK,
    maxTokens: optimalSettings.maxTokens,
    frequencyPenalty: optimalSettings.frequencyPenalty,
    presencePenalty: optimalSettings.presencePenalty
  }
}