import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { ErrorAnalysis, ErrorAnalyzer, QuickFix } from './error-analyzer'
import { TemplateId } from '@/lib/templates'

export interface RecoveryStrategy {
  id: string
  name: string
  description: string
  confidence: number
  estimatedTime: string
  steps: RecoveryStep[]
  rollbackSupported: boolean
  automaticApply: boolean
  priority: number
  conditions: RecoveryCondition[]
}

export interface RecoveryStep {
  id: string
  name: string
  description: string
  action: RecoveryAction
  parameters: Record<string, any>
  rollbackAction?: RecoveryAction
  validationCheck?: (result: any) => boolean
}

export interface RecoveryAction {
  type: 'code_modification' | 'configuration_change' | 'dependency_install' | 'restart_service' | 'rollback_changes' | 'manual_intervention'
  target: string
  operation: string
  payload: any
}

export interface RecoveryCondition {
  type: 'error_pattern' | 'execution_context' | 'environment_state' | 'user_permission'
  condition: string
  value: any
}

export interface RecoveryResult {
  success: boolean
  strategyId: string
  appliedSteps: string[]
  error?: string
  rollbackAvailable: boolean
  recommendations: string[]
  newFragmentState?: FragmentSchema
}

export interface RecoveryContext {
  fragment: FragmentSchema
  error: Error | string
  executionResult: ExecutionResult
  template: TemplateId
  environment: Record<string, string>
  userPermissions: RecoveryPermission[]
  previousAttempts: RecoveryAttempt[]
}

export interface RecoveryPermission {
  action: string
  granted: boolean
  restrictions?: string[]
}

export interface RecoveryAttempt {
  strategyId: string
  timestamp: number
  success: boolean
  error?: string
  rollbackPerformed: boolean
}

export interface RecoverySnapshot {
  id: string
  timestamp: number
  fragmentState: FragmentSchema
  environmentState: Record<string, string>
  description: string
}

export class RecoveryManager {
  private recoveryStrategies: RecoveryStrategy[] = []
  private snapshots: RecoverySnapshot[] = []
  private errorAnalyzer: ErrorAnalyzer
  private maxSnapshots = 10
  private rollbackStack: RecoverySnapshot[] = []

  constructor(errorAnalyzer?: ErrorAnalyzer) {
    this.errorAnalyzer = errorAnalyzer || new ErrorAnalyzer()
    this.initializeRecoveryStrategies()
  }

  async attemptRecovery(context: RecoveryContext): Promise<RecoveryResult> {
    try {
      // Create snapshot before recovery
      const snapshot = await this.createSnapshot(context.fragment, 'Pre-recovery state')
      
      // Analyze error first
      const errorAnalysis = await this.errorAnalyzer.analyzeError(context.error, {
        fragment: context.fragment,
        template: context.template,
        executionResult: context.executionResult,
        code: context.fragment.code || '',
        environment: context.environment
      })

      // Find suitable recovery strategies
      const suitableStrategies = await this.findSuitableStrategies(errorAnalysis, context)
      
      if (suitableStrategies.length === 0) {
        return {
          success: false,
          strategyId: 'none',
          appliedSteps: [],
          error: 'No suitable recovery strategies found',
          rollbackAvailable: true,
          recommendations: [
            'Review the error manually',
            'Check documentation for similar issues',
            'Consider simplifying the code',
            'Verify all dependencies are installed'
          ]
        }
      }

      // Try strategies in order of priority
      for (const strategy of suitableStrategies) {
        const result = await this.applyRecoveryStrategy(strategy, context)
        
        if (result.success) {
          return result
        }
        
        // If strategy failed, try rollback if supported
        if (strategy.rollbackSupported) {
          await this.rollbackToSnapshot(snapshot.id)
        }
      }

      // If all strategies failed
      return {
        success: false,
        strategyId: 'all_failed',
        appliedSteps: [],
        error: 'All recovery strategies failed',
        rollbackAvailable: true,
        recommendations: [
          'Manual intervention required',
          'Check system logs for more details',
          'Consider reaching out for support'
        ]
      }

    } catch (error) {
      return {
        success: false,
        strategyId: 'error',
        appliedSteps: [],
        error: error instanceof Error ? error.message : 'Unknown error during recovery',
        rollbackAvailable: true,
        recommendations: ['Recovery process encountered an error']
      }
    }
  }

  async createSnapshot(fragment: FragmentSchema, description: string): Promise<RecoverySnapshot> {
    const snapshot: RecoverySnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      fragmentState: JSON.parse(JSON.stringify(fragment)),
      environmentState: {},
      description
    }

    this.snapshots.push(snapshot)
    
    // Maintain max snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  async rollbackToSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) {
      return false
    }

    try {
      // Rollback would be implemented here
      // This is a placeholder for the actual rollback mechanism
      console.log('Rolling back to snapshot:', snapshot.description)
      return true
    } catch (error) {
      console.error('Rollback failed:', error)
      return false
    }
  }

  async getRecoveryRecommendations(context: RecoveryContext): Promise<string[]> {
    const recommendations: string[] = []

    // Analyze the error context
    const errorAnalysis = await this.errorAnalyzer.analyzeError(context.error, {
      fragment: context.fragment,
      template: context.template,
      executionResult: context.executionResult,
      code: context.fragment.code || '',
      environment: context.environment
    })

    // Add error-specific recommendations
    if (errorAnalysis.suggestions) {
      recommendations.push(...errorAnalysis.suggestions.map(s => s.description))
    }

    // Add general recommendations based on error patterns
    const errorMessage = context.error instanceof Error ? context.error.message : context.error
    
    if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('Cannot find module')) {
      recommendations.push('Install missing dependencies')
      recommendations.push('Check package.json or requirements.txt')
    }

    if (errorMessage.includes('SyntaxError') || errorMessage.includes('Unexpected token')) {
      recommendations.push('Review code syntax')
      recommendations.push('Check for missing brackets or quotes')
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
      recommendations.push('Increase timeout values')
      recommendations.push('Optimize performance-critical sections')
    }

    if (errorMessage.includes('memory') || errorMessage.includes('MemoryError')) {
      recommendations.push('Optimize memory usage')
      recommendations.push('Process data in smaller chunks')
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      recommendations.push('Check network connectivity')
      recommendations.push('Implement retry logic for network requests')
    }

    return recommendations
  }

  getAvailableSnapshots(): RecoverySnapshot[] {
    return [...this.snapshots].reverse() // Most recent first
  }

  private async findSuitableStrategies(
    errorAnalysis: ErrorAnalysis,
    context: RecoveryContext
  ): Promise<RecoveryStrategy[]> {
    const suitableStrategies: RecoveryStrategy[] = []

    for (const strategy of this.recoveryStrategies) {
      if (await this.isStrategyApplicable(strategy, errorAnalysis, context)) {
        suitableStrategies.push(strategy)
      }
    }

    // Sort by priority (higher priority first)
    return suitableStrategies.sort((a, b) => b.priority - a.priority)
  }

  private async isStrategyApplicable(
    strategy: RecoveryStrategy,
    errorAnalysis: ErrorAnalysis,
    context: RecoveryContext
  ): Promise<boolean> {
    // Check if strategy conditions are met
    for (const condition of strategy.conditions) {
      if (!await this.evaluateCondition(condition, errorAnalysis, context)) {
        return false
      }
    }

    return true
  }

  private async evaluateCondition(
    condition: RecoveryCondition,
    errorAnalysis: ErrorAnalysis,
    context: RecoveryContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'error_pattern':
        const errorMessage = context.error instanceof Error ? context.error.message : context.error
        return new RegExp(condition.condition).test(errorMessage)
      
      case 'execution_context':
        return context.template === condition.value
      
      case 'environment_state':
        return context.environment[condition.condition] === condition.value
      
      case 'user_permission':
        return context.userPermissions.some(p => p.action === condition.condition && p.granted)
      
      default:
        return true
    }
  }

  private async applyRecoveryStrategy(
    strategy: RecoveryStrategy,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const appliedSteps: string[] = []
    let newFragmentState = JSON.parse(JSON.stringify(context.fragment))

    try {
      for (const step of strategy.steps) {
        const stepResult = await this.executeRecoveryStep(step, context, newFragmentState)
        
        if (!stepResult.success) {
          return {
            success: false,
            strategyId: strategy.id,
            appliedSteps,
            error: stepResult.error,
            rollbackAvailable: strategy.rollbackSupported,
            recommendations: []
          }
        }

        appliedSteps.push(step.id)
        
        // Update fragment state if modified
        if (stepResult.newFragmentState) {
          newFragmentState = stepResult.newFragmentState
        }
      }

      return {
        success: true,
        strategyId: strategy.id,
        appliedSteps,
        rollbackAvailable: strategy.rollbackSupported,
        recommendations: [],
        newFragmentState
      }

    } catch (error) {
      return {
        success: false,
        strategyId: strategy.id,
        appliedSteps,
        error: error instanceof Error ? error.message : 'Unknown error',
        rollbackAvailable: strategy.rollbackSupported,
        recommendations: []
      }
    }
  }

  private async executeRecoveryStep(
    step: RecoveryStep,
    context: RecoveryContext,
    currentState: FragmentSchema
  ): Promise<{ success: boolean; error?: string; newFragmentState?: FragmentSchema }> {
    try {
      switch (step.action.type) {
        case 'code_modification':
          return await this.handleCodeModification(step, currentState)
        
        case 'dependency_install':
          return await this.handleDependencyInstall(step, context)
        
        case 'configuration_change':
          return await this.handleConfigurationChange(step, context)
        
        case 'restart_service':
          return await this.handleServiceRestart(step, context)
        
        case 'rollback_changes':
          return await this.handleRollback(step, context)
        
        case 'manual_intervention':
          return await this.handleManualIntervention(step, context)
        
        default:
          return { success: false, error: `Unknown action type: ${step.action.type}` }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private async handleCodeModification(
    step: RecoveryStep,
    currentState: FragmentSchema
  ): Promise<{ success: boolean; error?: string; newFragmentState?: FragmentSchema }> {
    const newState = JSON.parse(JSON.stringify(currentState))
    const { operation, payload } = step.action
    
    switch (operation) {
      case 'replace':
        if (payload.oldCode && payload.newCode) {
          newState.code = newState.code?.replace(payload.oldCode, payload.newCode)
        }
        break
      
      case 'insert':
        if (payload.code && payload.position !== undefined) {
          const lines = newState.code?.split('\n') || []
          lines.splice(payload.position, 0, payload.code)
          newState.code = lines.join('\n')
        }
        break
      
      case 'remove':
        if (payload.pattern) {
          newState.code = newState.code?.replace(new RegExp(payload.pattern, 'g'), '')
        }
        break
      
      default:
        return { success: false, error: `Unknown code modification operation: ${operation}` }
    }

    return { success: true, newFragmentState: newState }
  }

  private async handleDependencyInstall(
    step: RecoveryStep,
    context: RecoveryContext
  ): Promise<{ success: boolean; error?: string }> {
    // This would integrate with the package manager
    // For now, just simulate the installation
    const { payload } = step.action
    
    console.log(`Installing dependency: ${payload.package}`)
    
    // In a real implementation, this would execute:
    // - npm install for Node.js projects
    // - pip install for Python projects
    // - Add to requirements.txt or package.json
    
    return { success: true }
  }

  private async handleConfigurationChange(
    step: RecoveryStep,
    context: RecoveryContext
  ): Promise<{ success: boolean; error?: string }> {
    // This would modify configuration files
    const { payload } = step.action
    
    console.log(`Changing configuration: ${payload.key} = ${payload.value}`)
    
    return { success: true }
  }

  private async handleServiceRestart(
    step: RecoveryStep,
    context: RecoveryContext
  ): Promise<{ success: boolean; error?: string }> {
    // This would restart the E2B sandbox or service
    console.log('Restarting service...')
    
    return { success: true }
  }

  private async handleRollback(
    step: RecoveryStep,
    context: RecoveryContext
  ): Promise<{ success: boolean; error?: string }> {
    const { payload } = step.action
    
    if (payload.snapshotId) {
      const success = await this.rollbackToSnapshot(payload.snapshotId)
      return { success, error: success ? undefined : 'Rollback failed' }
    }
    
    return { success: false, error: 'No snapshot ID provided for rollback' }
  }

  private async handleManualIntervention(
    step: RecoveryStep,
    context: RecoveryContext
  ): Promise<{ success: boolean; error?: string }> {
    // This would trigger a manual intervention workflow
    console.log(`Manual intervention required: ${step.description}`)
    
    return { success: true }
  }

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      // Missing dependency strategy
      {
        id: 'install_missing_dependency',
        name: 'Install Missing Dependency',
        description: 'Automatically install missing packages',
        confidence: 0.9,
        estimatedTime: '1-2 minutes',
        rollbackSupported: true,
        automaticApply: true,
        priority: 90,
        conditions: [
          {
            type: 'error_pattern',
            condition: 'ModuleNotFoundError|Cannot find module',
            value: true
          }
        ],
        steps: [
          {
            id: 'extract_package_name',
            name: 'Extract Package Name',
            description: 'Extract the missing package name from error',
            action: {
              type: 'manual_intervention',
              target: 'error_analysis',
              operation: 'extract_package',
              payload: {}
            },
            parameters: {}
          },
          {
            id: 'install_package',
            name: 'Install Package',
            description: 'Install the missing package',
            action: {
              type: 'dependency_install',
              target: 'package_manager',
              operation: 'install',
              payload: { package: 'extracted_package' }
            },
            parameters: {}
          }
        ]
      },

      // Syntax error strategy
      {
        id: 'fix_syntax_error',
        name: 'Fix Syntax Error',
        description: 'Apply automated syntax fixes',
        confidence: 0.7,
        estimatedTime: '30 seconds',
        rollbackSupported: true,
        automaticApply: true,
        priority: 85,
        conditions: [
          {
            type: 'error_pattern',
            condition: 'SyntaxError|Unexpected token',
            value: true
          }
        ],
        steps: [
          {
            id: 'apply_syntax_fix',
            name: 'Apply Syntax Fix',
            description: 'Apply automated syntax corrections',
            action: {
              type: 'code_modification',
              target: 'source_code',
              operation: 'replace',
              payload: { /* would be populated based on error analysis */ }
            },
            parameters: {}
          }
        ]
      },

      // Memory optimization strategy
      {
        id: 'optimize_memory',
        name: 'Optimize Memory Usage',
        description: 'Apply memory optimization techniques',
        confidence: 0.6,
        estimatedTime: '2-5 minutes',
        rollbackSupported: true,
        automaticApply: false,
        priority: 70,
        conditions: [
          {
            type: 'error_pattern',
            condition: 'MemoryError|out of memory',
            value: true
          }
        ],
        steps: [
          {
            id: 'add_memory_optimization',
            name: 'Add Memory Optimization',
            description: 'Add memory optimization techniques',
            action: {
              type: 'code_modification',
              target: 'source_code',
              operation: 'insert',
              payload: {
                code: '# Memory optimization applied',
                position: 0
              }
            },
            parameters: {}
          }
        ]
      },

      // Network timeout strategy
      {
        id: 'increase_timeout',
        name: 'Increase Timeout',
        description: 'Increase timeout values for network requests',
        confidence: 0.8,
        estimatedTime: '1 minute',
        rollbackSupported: true,
        automaticApply: true,
        priority: 80,
        conditions: [
          {
            type: 'error_pattern',
            condition: 'timeout|TimeoutError',
            value: true
          }
        ],
        steps: [
          {
            id: 'modify_timeout',
            name: 'Modify Timeout',
            description: 'Increase timeout values',
            action: {
              type: 'code_modification',
              target: 'source_code',
              operation: 'replace',
              payload: {
                oldCode: 'timeout=5',
                newCode: 'timeout=30'
              }
            },
            parameters: {}
          }
        ]
      },

      // Restart service strategy
      {
        id: 'restart_service',
        name: 'Restart Service',
        description: 'Restart the execution environment',
        confidence: 0.5,
        estimatedTime: '30 seconds',
        rollbackSupported: false,
        automaticApply: false,
        priority: 60,
        conditions: [
          {
            type: 'user_permission',
            condition: 'restart_service',
            value: true
          }
        ],
        steps: [
          {
            id: 'restart',
            name: 'Restart',
            description: 'Restart the service',
            action: {
              type: 'restart_service',
              target: 'e2b_sandbox',
              operation: 'restart',
              payload: {}
            },
            parameters: {}
          }
        ]
      }
    ]
  }
}

// Export singleton instance
export const recoveryManager = new RecoveryManager()