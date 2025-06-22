// lib/hooks/useAutoProjectChat.ts
import { useState, useCallback, useRef } from 'react'
import { useProjectStore } from '@/lib/stores/projects'
import { useChatSidebarStore } from '@/lib/stores/chat-sidebar-stores'
import { toast } from 'sonner'
import React from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AutoCreatedProject {
  id: string
  title: string
  framework: string
  description: string
}

export interface ChatResponse {
  message: string
  chatSessionId: string
  projectId?: string
  autoCreatedProject?: AutoCreatedProject
  timestamp: string
}

export interface UseAutoProjectChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  chatSessionId: string | null
  currentProjectId: string | null
  sendMessage: (message: string) => Promise<void>
  clearChat: () => void
  loadChatHistory: (sessionId?: string, projectId?: string) => Promise<void>
}

export function useAutoProjectChat(): UseAutoProjectChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  
  const projectStore = useProjectStore()
  const chatSidebarStore = useChatSidebarStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage])

      // Send to enhanced chat API
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          chatSessionId,
          projectId: currentProjectId,
          messages
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data: ChatResponse = await response.json()

      // Update chat session ID if new
      if (data.chatSessionId && data.chatSessionId !== chatSessionId) {
        setChatSessionId(data.chatSessionId)
      }

      // Handle auto-created project
      if (data.autoCreatedProject) {
        const project = {
          id: data.autoCreatedProject.id,
          title: data.autoCreatedProject.title,
          description: data.autoCreatedProject.description,
          framework: data.autoCreatedProject.framework,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: '', // Will be set by the store
          isPublic: false,
          chatSessionId: data.chatSessionId,
          isAutoCreated: true
        }

        // After auto-creating a project, refetch projects to update the store
        await projectStore.fetchProjects()
        setCurrentProjectId(project.id) // Set the current project ID in the hook's state

        // Show success notification
        toast.success(`Project "${project.title}" created automatically!`, {
          description: `Your ${project.framework} project is ready to customize.`,
          action: {
            label: 'View Project',
            onClick: () => {
              // Navigate to project (implementation depends on routing)
              window.location.href = `/projects/${project.id}`
            }
          }
        })
      }

      // Update project ID if provided
      if (data.projectId && data.projectId !== currentProjectId) {
        setCurrentProjectId(data.projectId)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update chat sidebar
      if (data.chatSessionId) {
        chatSidebarStore.addChatSession({
          id: data.chatSessionId,
          title: data.autoCreatedProject?.title || extractChatTitle(message),
          projectId: data.projectId,
          lastMessage: data.message.slice(0, 100),
          timestamp: new Date(data.timestamp),
          isActive: true,
          messages: [], // Initialize with empty array
          createdAt: new Date(), // Set current date
          updatedAt: new Date() // Set current date
        })
        chatSidebarStore.setSelectedChatId(data.chatSessionId)
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return // Request was cancelled
        }
        setError(error.message)
        toast.error('Failed to send message', {
          description: error.message
        })
      } else {
        setError('An unexpected error occurred')
        toast.error('Failed to send message')
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [isLoading, chatSessionId, currentProjectId, messages, projectStore, chatSidebarStore])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setChatSessionId(null)
    setCurrentProjectId(null)
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const loadChatHistory = useCallback(async (sessionId?: string, projectId?: string) => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      if (projectId) params.set('projectId', projectId)

      const response = await fetch(`/api/chat/enhanced?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }

      const data = await response.json()
      
      if (data.sessions && data.sessions.length > 0) {
        const session = data.sessions[0]
        setMessages(session.messages || [])
        setChatSessionId(session.session_id)
        setCurrentProjectId(session.project_id)
      }

    } catch (error) {
      console.error('Error loading chat history:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    chatSessionId,
    currentProjectId,
    sendMessage,
    clearChat,
    loadChatHistory
  }
}

// Helper function to extract a title from the first message
function extractChatTitle(message: string): string {
  // Extract first few words or a meaningful phrase
  const words = message.trim().split(' ').slice(0, 6)
  let title = words.join(' ')
  
  if (title.length > 50) {
    title = title.slice(0, 47) + '...'
  }
  
  return title || 'New Chat'
}

// Enhanced hook with project context
export function useAutoProjectChatWithContext(initialProjectId?: string) {
  const chat = useAutoProjectChat()
  const projectStore = useProjectStore()

  // Set initial project context
  React.useEffect(() => {
    if (initialProjectId && initialProjectId !== chat.currentProjectId) {
      chat.loadChatHistory(undefined, initialProjectId)
    }
  }, [chat, initialProjectId])

  return {
    ...chat,
    projects: projectStore.projects,
    currentProject: projectStore.projects.find(p => p.id === chat.currentProjectId)
  }
}
