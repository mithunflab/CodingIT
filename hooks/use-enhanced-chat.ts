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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [context, setContext] = useState({
    cwd: '/home/project',
    projectFiles: [] as string[],
    userLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    previousErrors: [] as string[],
    supabase: undefined as any
  })

  const { messages, input, setInput, append, isLoading, stop, error, setMessages } = useChat({
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

  const submitMessage = useCallback(
    async (content: string) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      analyzeUserLevel(content)

      try {
        await append({
          role: 'user',
          content,
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [append, analyzeUserLevel, isSubmitting],
  )

  const trackError = useCallback((error: string) => {
    setContext(prev => ({
      ...prev,
      previousErrors: [...prev.previousErrors.slice(-4), error] // Keep last 5 errors
    }))
  }, [])

  const executeCode = useCallback(
    async (code: string) => {
      if (isExecuting) return
      setIsExecuting(true)

      try {
        const response = await fetch('/api/code/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionID: chatConfig.userID,
            code,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to execute code')
        }

        const result = await response.json()
        
        const lastMessage = messages[messages.length - 1]
        if (lastMessage) {
          const updatedMessage = {
            ...lastMessage,
            result: result,
          }
          setMessages([...messages.slice(0, -1), updatedMessage])
        }

      } catch (error: any) {
        trackError(error.message)
      } finally {
        setIsExecuting(false)
      }
    },
    [isExecuting, chatConfig.userID, trackError, messages, setMessages],
  )

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
    isLoading: isLoading || isSubmitting || isExecuting,
    stop,
    error,
    context,
    updateContext,
    trackError,
    executeCode,
  }
}
