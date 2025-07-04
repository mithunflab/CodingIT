'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Templates } from '@/lib/templates'
import { LLMModel, LLMModelConfig } from '@/lib/models'

export interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: string
}

interface EnhancedChatConfig {
  userID?: string
  teamID?: string
  template: Templates
  model: LLMModel
  config: LLMModelConfig
  onFinish?: (message: Message) => void
}

export function useEnhancedChat(chatConfig: EnhancedChatConfig) {
  const [context, setContext] = useState({
    cwd: '/home/project',
    projectFiles: [] as string[],
    userLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    previousErrors: [] as string[],
    supabase: undefined as any
  })

  const { messages, input, setInput, append, isLoading, stop, error } = useChat({
    api: '/api/chat',
    body: {
      userID: chatConfig.userID,
      teamID: chatConfig.teamID,
      template: chatConfig.template,
      model: chatConfig.model,
      config: chatConfig.config,
      context
    },
    onFinish: chatConfig.onFinish
      ? (message: any) => {
          const { id, role, content, createdAt } = message;
          if (role === 'user' || role === 'assistant' || role === 'system') {
            chatConfig.onFinish!({ id, role, content, createdAt });
          }
        }
      : undefined
  })

  const updateContext = useCallback((newContext: Partial<typeof context>) => {
    setContext(prev => ({ ...prev, ...newContext }))
  }, [])

  const analyzeUserLevel = useCallback((userInput: string) => {
    const input = userInput.toLowerCase()
    
    if (input.includes('beginner') || 
        input.includes('new to') || 
        input.includes('just started') ||
        input.includes('explain') ||
        input.includes('what is')) {
      updateContext({ userLevel: 'beginner' })
    } else if (input.includes('advanced') || 
               input.includes('expert') || 
               input.includes('production') ||
               input.includes('optimize') ||
               input.includes('performance')) {
      updateContext({ userLevel: 'expert' })
    } else {
      updateContext({ userLevel: 'intermediate' })
    }
  }, [updateContext])

  const submitMessage = useCallback(async (content: string) => {
    analyzeUserLevel(content)
    
    await append({
      role: 'user',
      content
    })
  }, [append, analyzeUserLevel])

  const trackError = useCallback((error: string) => {
    setContext(prev => ({
      ...prev,
      previousErrors: [...prev.previousErrors.slice(-4), error] // Keep last 5 errors
    }))
  }, [])

  useEffect(() => {
    if (error) {
      trackError(error.message)
    }
  }, [error, trackError])

  return {
    messages,
    input,
    setInput,
    submitMessage,
    isLoading,
    stop,
    error,
    context,
    updateContext,
    trackError
  }
}
