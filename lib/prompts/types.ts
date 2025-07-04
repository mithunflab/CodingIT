export interface UserContext {
  userId?: string
  teamId?: string
  skillLevel: 'beginner' | 'intermediate' | 'expert'
  preferences: UserPreferences
  sessionId: string
  interactionHistory: InteractionRecord[]
}

export interface UserPreferences {
  preferredTemplates: string[]
  codingStyle: 'verbose' | 'concise' | 'balanced'
  frameworkPreferences: Record<string, number>
  errorHandlingLevel: 'basic' | 'comprehensive' | 'minimal'
  commentStyle: 'detailed' | 'minimal' | 'none'
}

export interface InteractionRecord {
  timestamp: number
  template: string
  prompt: string
  success: boolean
  executionTime?: number
  errorType?: ErrorType
  userFeedback?: 'positive' | 'negative' | 'neutral'
}

export interface ProjectContext {
  fileStructure: FileNode[]
  dependencies: string[]
  frameworks: string[]
  languages: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  existingFiles: FileInfo[]
  uploadedFiles: UploadedFileContext[]
}

export interface FileNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
}

export interface FileInfo {
  path: string
  content: string
  language: string
  size: number
}

export interface UploadedFileContext {
  name: string
  type: string
  size: number
  content?: string
  metadata?: Record<string, any>
}

export interface TemplateConfidence {
  templateId: string
  confidence: number
  reasons: string[]
  keywordMatches: number
  contextAlignment: number
  userPreferenceAlignment: number
}

export interface PerformanceMetrics {
  promptGenerationTime: number
  templateSelectionTime: number
  executionTime?: number
  successRate: number
  errorRate: number
  retryCount: number
}

export interface OptimizationResult {
  originalPrompt: string
  optimizedPrompt: string
  optimizations: OptimizationType[]
  confidenceIncrease: number
  expectedPerformanceGain: number
}

export interface ErrorPattern {
  errorType: ErrorType
  frequency: number
  context: string[]
  resolution: string
  preventionStrategy: string
}

export type ErrorType = 
  | 'syntax_error'
  | 'runtime_error' 
  | 'dependency_error'
  | 'template_mismatch'
  | 'timeout_error'
  | 'permission_error'
  | 'network_error'

export type OptimizationType =
  | 'error_handling_enhanced'
  | 'dependency_optimized'
  | 'template_refined'
  | 'context_improved'
  | 'skill_adapted'
  | 'performance_optimized'

export interface EnhancedPromptConfig {
  enableIntelligentSelection: boolean
  enableUserLearning: boolean
  enablePerformanceOptimization: boolean
  enableErrorRecovery: boolean
  maxRetries: number
  optimizationThreshold: number
  storageRetentionDays: number
}

export interface AnalyzerResult<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence: number
  executionTime: number
}

export interface OptimizerResult {
  optimized: boolean
  newPrompt?: string
  optimizations: OptimizationType[]
  performanceGain: number
  confidence: number
}