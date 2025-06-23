"use client"

import { E2BToolResult, E2BToolError, E2BToolProgress, E2BToolClient } from '@/lib/e2b/toolClient'
import { E2BToolType } from '@/lib/e2b/toolPrompts'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseE2BToolsOptions {
  userID: string
  teamID: string
  sessionId?: string
  model: LLMModel
  config: LLMModelConfig
  onSuccess?: (result: E2BToolResult) => void
  onError?: (error: E2BToolError) => void
}

export interface UseE2BToolsReturn {
  executeE2BTool: (toolType: E2BToolType, userInput: string, projectFiles?: Array<{
    name: string
    content: string
    path: string
    type: string
  }>) => Promise<void>
  isExecuting: boolean
  progress: E2BToolProgress | null
  lastResult: E2BToolResult | null
  error: E2BToolError | null
  cancelExecution: () => void
  clearError: () => void
  availableTools: Array<{ id: string; name: string; description: string }>
}

export function useE2BTools(options: UseE2BToolsOptions): UseE2BToolsReturn {
  const { userID, teamID, sessionId, model, config, onSuccess, onError } = options
  
  const [isExecuting, setIsExecuting] = useState(false)
  const [progress, setProgress] = useState<E2BToolProgress | null>(null)
  const [lastResult, setLastResult] = useState<E2BToolResult | null>(null)
  const [error, setError] = useState<E2BToolError | null>(null)
  const [availableTools, setAvailableTools] = useState<Array<{ id: string; name: string; description: string }>>([])
  
  const clientRef = useRef(new E2BToolClient())

  useEffect(() => {
    const loadTools = async () => {
      try {
        const tools = await clientRef.current.getAvailableTools()
        setAvailableTools(tools)
      } catch (err) {
        console.warn('Failed to load available tools:', err)
      }
    }
    
    loadTools()
  }, [])

  const executeE2BTool = useCallback(async (
    toolType: E2BToolType, 
    userInput: string, 
    projectFiles?: Array<{
      name: string
      content: string
      path: string
      type: string
    }>
  ) => {
    if (isExecuting) {
      console.warn('Tools execution already in progress')
      return
    }

    setIsExecuting(true)
    setError(null)
    setProgress(null)

    try {
      const result = await clientRef.current.execute({
        toolType,
        userInput,
        model,
        config,
        userID,
        teamID,
        sessionId,
        projectFiles,
        onProgress: (progress) => {
          setProgress(progress)
        },
        onError: (err) => {
          setError(err)
        }
      })

      setLastResult(result)
      onSuccess?.(result)
      
    } catch (err: any) {
      const executionError: E2BToolError = {
        code: 'EXECUTION_FAILED',
        message: err.message || 'Tool execution failed',
        details: err
      }
      setError(executionError)
      onError?.(executionError)
    } finally {
      setIsExecuting(false)
      setProgress(null)
    }
  }, [isExecuting, model, config, userID, teamID, sessionId, onSuccess, onError])

  const cancelExecution = useCallback(() => {
    clientRef.current.cancel()
    setIsExecuting(false)
    setProgress(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    executeE2BTool,
    isExecuting,
    progress,
    lastResult,
    error,
    cancelExecution,
    clearError,
    availableTools
  }
}

export const e2bToolClient = new E2BToolClient()

export type { E2BToolType }
