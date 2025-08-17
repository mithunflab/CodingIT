'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Templates } from '@/lib/templates'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { ChatSession } from '@/lib/chat-persistence'

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
  sessionId?: string
  saveToHistory?: boolean
  onFinish?: (message: Message) => void
  onSessionCreated?: (sessionId: string) => void
}

export function useEnhancedChat(chatConfig: EnhancedChatConfig) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(chatConfig.sessionId)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
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
      sessionId: currentSessionId,
      saveToHistory: chatConfig.saveToHistory ?? true,
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

  const trackError = useCallback((error: string) => {
    setContext(prev => ({
      ...prev,
      previousErrors: [...prev.previousErrors.slice(-4), error] // Keep last 5 errors
    }))
  }, [])

  const submitMessage = useCallback(
    async (content: string, retryCount = 0) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      analyzeUserLevel(content)

      try {
        await append({
          role: 'user',
          content,
        })
      } catch (error: any) {
        console.error('Submit message error:', error)
        
        // Auto-retry once for network errors
        if (retryCount === 0 && (error.message.includes('network') || error.message.includes('fetch'))) {
          console.log('Retrying message submission...')
          setTimeout(() => {
            setIsSubmitting(false)
            submitMessage(content, 1)
          }, 2000)
          return
        }
        
        trackError(error.message)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [append, analyzeUserLevel, isSubmitting, trackError],
  )

  const executeCode = useCallback(
    async (code: string) => {
      if (isExecuting) return { error: 'Code execution already in progress' }
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
          let errorMessage = 'Failed to execute code'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        
        // Reset error tracking on successful execution
        if (context.previousErrors.length > 0) {
          updateContext({ previousErrors: [] })
        }
        
        return result
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown execution error'
        trackError(errorMessage)
        
        console.error('Code execution failed:', {
          error: errorMessage,
          code: code.substring(0, 200), // Log first 200 chars of code
          sessionID: chatConfig.userID
        })
        
        return { 
          error: errorMessage,
          type: 'execution_error'
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [isExecuting, chatConfig.userID, trackError, context.previousErrors, updateContext],
  )

  // Session management functions
  const loadUserSessions = useCallback(async () => {
    if (!chatConfig.userID) return

    setLoadingSessions(true)
    try {
      const response = await fetch('/api/chat/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load user sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }, [chatConfig.userID])

  const createNewSession = useCallback(async (title?: string) => {
    if (!chatConfig.userID) return null

    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: chatConfig.teamID,
          title,
          model: chatConfig.model.id,
          template: chatConfig.template,
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newSessionId = data.session.sessionId
        setCurrentSessionId(newSessionId)
        setSessions(prev => [data.session, ...prev])
        
        if (chatConfig.onSessionCreated) {
          chatConfig.onSessionCreated(newSessionId)
        }
        
        return data.session
      }
    } catch (error) {
      console.error('Failed to create new session:', error)
    }
    return null
  }, [chatConfig.userID, chatConfig.teamID, chatConfig.model, chatConfig.template, chatConfig.onSessionCreated])

  const loadSession = useCallback(async (sessionId: string) => {
    if (!chatConfig.userID) return null

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(sessionId)
        
        // Convert session messages to the format expected by useChat
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp,
        }))
        
        setMessages(formattedMessages)
        return data.session
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
    return null
  }, [chatConfig.userID, setMessages])

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })

      if (response.ok) {
        setSessions(prev => prev.map(session => 
          session.sessionId === sessionId 
            ? { ...session, title }
            : session
        ))
      }
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId))
        
        // If we deleted the current session, clear it
        if (currentSessionId === sessionId) {
          setCurrentSessionId(undefined)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }, [currentSessionId, setMessages])

  // Load sessions on mount if user is authenticated
  useEffect(() => {
    if (chatConfig.userID && sessions.length === 0) {
      loadUserSessions()
    }
  }, [chatConfig.userID, loadUserSessions, sessions.length])

  // Handle session ID changes from the API response
  useEffect(() => {
    const handleResponse = (event: CustomEvent) => {
      const sessionId = event.detail?.headers?.get?.('X-Session-Id')
      if (sessionId && sessionId !== currentSessionId) {
        setCurrentSessionId(sessionId)
        if (chatConfig.onSessionCreated) {
          chatConfig.onSessionCreated(sessionId)
        }
      }
    }

    // This would need to be implemented to capture the response headers from the chat API
    // For now, we'll rely on the sessionId being included in the response
  }, [currentSessionId, chatConfig.onSessionCreated])

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
    // Session management
    currentSessionId,
    sessions,
    loadingSessions,
    loadUserSessions,
    createNewSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
  }
}
