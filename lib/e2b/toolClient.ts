import type { E2BToolType } from "@/lib/e2b/toolPrompts"
import type { LLMModel, LLMModelConfig } from "@/lib/models"

export type { E2BToolType }

export interface E2BToolExecutionOptions {
  toolType: E2BToolType
  userInput: string
  templateId?: string
  model: LLMModel
  config: LLMModelConfig
  userID: string
  teamID: string
  sessionId?: string
  projectFiles?: Array<{
    name: string
    content: string
    path: string
    type: string
  }>
  onProgress?: (progress: E2BToolProgress) => void
  onError?: (error: E2BToolError) => void
}

export interface E2BToolProgress {
  phase: 'initializing' | 'generating_prompt' | 'executing_ai' | 'sandbox_execution' | 'completed'
  message: string
  progress: number // 0-100
  details?: any
}

export interface E2BToolError {
  code: string
  message: string
  details?: any
  requestId?: string
}

export interface E2BToolResult {
  success: boolean
  toolType: E2BToolType
  executionResult: {
    toolResponse: any
    sandboxId: string
    files: Array<{
      path: string
      content: string
      type?: string
    }>
    execution: any
    aiResponse: string
  }
  performance: {
    executionTime: number
    memoryUsage?: number
    tokenUsage?: number
  }
  requestId: string
}

export class E2BToolClient {
  private baseUrl: string
  private abortController: AbortController | null = null

  constructor(baseUrl = '/api/tools') {  // Fixed: changed from '/api/e2b/tools' to '/api/tools'
    this.baseUrl = baseUrl
  }

  async execute(options: E2BToolExecutionOptions): Promise<E2BToolResult> {
    const {
      toolType,
      userInput,
      templateId,
      model,
      config,
      userID,
      teamID,
      sessionId,
      projectFiles,
      onProgress,
      onError
    } = options

    this.abortController = new AbortController()

    try {
      onProgress?.({
        phase: 'initializing',
        message: `Initializing ${toolType} execution...`,
        progress: 10
      })

      // Prepare request payload
      const requestPayload = {
        toolType,
        userInput,
        templateId,
        model,
        config,
        userID,
        teamID,
        sessionId,
        projectFiles
      }

      onProgress?.({
        phase: 'generating_prompt',
        message: 'Generating specialized prompt for E2B execution...',
        progress: 25
      })

      // Execute tool via API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: this.abortController.signal,
      })

      onProgress?.({
        phase: 'executing_ai',
        message: 'AI model processing request...',
        progress: 50
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error: E2BToolError = {
          code: errorData.code || 'EXECUTION_FAILED',
          message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
          requestId: errorData.requestId
        }
        
        onError?.(error)
        throw new Error(error.message)
      }

      onProgress?.({
        phase: 'sandbox_execution',
        message: 'Executing in E2B sandbox environment...',
        progress: 75
      })

      const result: E2BToolResult = await response.json()

      onProgress?.({
        phase: 'completed',
        message: 'Tool execution completed successfully',
        progress: 100,
        details: {
          executionTime: result.performance.executionTime,
          filesGenerated: result.executionResult.files.length,
          sandboxId: result.executionResult.sandboxId
        }
      })

      return result

    } catch (error: any) {
      if (error.name === 'AbortError') {
        const abortError: E2BToolError = {
          code: 'EXECUTION_CANCELLED',
          message: 'Tool execution was cancelled by user',
        }
        onError?.(abortError)
        throw abortError
      }

      const execError: E2BToolError = {
        code: 'EXECUTION_ERROR',
        message: error.message || 'Tool execution failed',
        details: error
      }
      
      onError?.(execError)
      throw execError
    } finally {
      this.abortController = null
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  async getAvailableTools(): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`)
      }

      const data = await response.json()
      return data.tools || []
    } catch (error) {
      console.error('Failed to fetch available E2B tools:', error)
      return []
    }
  }

  validateToolInput(toolType: E2BToolType, userInput: string): { valid: boolean; error?: string } {
    if (!userInput?.trim()) {
      return { valid: false, error: 'User input is required' }
    }

    if (userInput.length > 50000) {
      return { valid: false, error: 'User input exceeds maximum length (50,000 characters)' }
    }

    switch (toolType) {
      case 'new_task':
        if (userInput.length < 10) {
          return { valid: false, error: 'Task description too short. Please provide more details.' }
        }
        break
      case 'condense':
        if (userInput.length < 100) {
          return { valid: false, error: 'Context too short for meaningful condensation' }
        }
        break
      case 'report_bug':
        if (!userInput.includes('error') && !userInput.includes('bug') && !userInput.includes('issue')) {
          return { valid: false, error: 'Bug report should describe the error or issue encountered' }
        }
        break
      default:
        break
    }

    return { valid: true }
  }
}

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