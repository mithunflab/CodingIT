import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { TemplateId } from '@/lib/templates'

export interface ProfileMetrics {
  executionTime: number
  memoryUsage: {
    peak: number
    average: number
    initial: number
    final: number
  }
  cpuUsage: {
    peak: number
    average: number
  }
  networkRequests: NetworkRequest[]
  codeComplexity: CodeComplexity
  performance: {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    bottlenecks: PerformanceBottleneck[]
  }
  timeline: ExecutionStep[]
  resourceUtilization: ResourceUtilization
}

export interface NetworkRequest {
  url: string
  method: string
  duration: number
  status: number
  size: number
  startTime: number
  endTime: number
}

export interface CodeComplexity {
  cyclomatic: number
  cognitive: number
  linesOfCode: number
  functionsCount: number
  classesCount: number
  imports: number
  dependencies: string[]
}

export interface PerformanceBottleneck {
  type: 'cpu' | 'memory' | 'network' | 'io' | 'database'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: {
    line: number
    column: number
    function?: string
  }
  duration: number
  impact: number
  suggestion: string
}

export interface ExecutionStep {
  id: string
  name: string
  startTime: number
  endTime: number
  duration: number
  type: 'initialization' | 'execution' | 'cleanup' | 'network' | 'computation'
  status: 'success' | 'error' | 'warning'
  metadata?: Record<string, any>
  children?: ExecutionStep[]
  memorySnapshot?: {
    used: number
    allocated: number
    freed: number
  }
}

export interface ResourceUtilization {
  cpu: {
    user: number
    system: number
    idle: number
  }
  memory: {
    heap: number
    stack: number
    external: number
  }
  io: {
    read: number
    write: number
    operations: number
  }
  network: {
    bytesReceived: number
    bytesSent: number
    requests: number
  }
}

export interface ProfilingContext {
  fragment: FragmentSchema
  template: TemplateId
  environment: Record<string, string>
  enableDetailedProfiling: boolean
  sampleRate: number
  maxTimelineEntries: number
}

export class ExecutionProfiler {
  private isProfilingActive = false
  private currentProfile: ProfileMetrics | null = null
  private profilingContext: ProfilingContext | null = null
  private startTime = 0
  private timeline: ExecutionStep[] = []
  private memorySnapshots: Array<{ timestamp: number; usage: number }> = []
  private networkRequests: NetworkRequest[] = []
  private performanceObserver: any = null

  constructor() {
    this.setupPerformanceObserver()
  }

  async startProfiling(context: ProfilingContext): Promise<void> {
    if (this.isProfilingActive) {
      throw new Error('Profiling is already active')
    }

    this.isProfilingActive = true
    this.profilingContext = context
    this.startTime = performance.now()
    this.timeline = []
    this.memorySnapshots = []
    this.networkRequests = []

    // Initialize profiling
    await this.initializeProfiling()

    // Start memory monitoring
    this.startMemoryMonitoring()

    // Start network monitoring
    this.startNetworkMonitoring()

    // Record initial step
    this.recordStep('initialization', 'Profiling started', 'initialization')
  }

  async stopProfiling(): Promise<ProfileMetrics> {
    if (!this.isProfilingActive || !this.profilingContext) {
      throw new Error('Profiling is not active')
    }

    const endTime = performance.now()
    const executionTime = endTime - this.startTime

    // Record final step
    this.recordStep('cleanup', 'Profiling stopped', 'cleanup')

    // Stop monitoring
    this.stopMemoryMonitoring()
    this.stopNetworkMonitoring()

    // Calculate metrics
    const metrics = await this.calculateMetrics(executionTime)

    // Reset state
    this.isProfilingActive = false
    this.currentProfile = metrics
    this.profilingContext = null

    return metrics
  }

  recordStep(
    id: string,
    name: string,
    type: ExecutionStep['type'],
    metadata?: Record<string, any>
  ): void {
    if (!this.isProfilingActive) return

    const now = performance.now()
    const step: ExecutionStep = {
      id,
      name,
      startTime: now,
      endTime: now,
      duration: 0,
      type,
      status: 'success',
      metadata,
      memorySnapshot: this.getMemorySnapshot()
    }

    this.timeline.push(step)
  }

  recordStepStart(id: string, name: string, type: ExecutionStep['type']): void {
    if (!this.isProfilingActive) return

    const now = performance.now()
    const step: ExecutionStep = {
      id,
      name,
      startTime: now,
      endTime: 0,
      duration: 0,
      type,
      status: 'success',
      memorySnapshot: this.getMemorySnapshot()
    }

    this.timeline.push(step)
  }

  recordStepEnd(id: string, status: ExecutionStep['status'] = 'success'): void {
    if (!this.isProfilingActive) return

    const now = performance.now()
    const stepIndex = this.timeline.findIndex(s => s.id === id && s.endTime === 0)
    
    if (stepIndex >= 0) {
      const step = this.timeline[stepIndex]
      step.endTime = now
      step.duration = now - step.startTime
      step.status = status
    }
  }

  recordNetworkRequest(request: NetworkRequest): void {
    if (!this.isProfilingActive) return
    this.networkRequests.push(request)
  }

  async getPerformanceRecommendations(): Promise<string[]> {
    if (!this.currentProfile) {
      return ['No profiling data available']
    }

    const recommendations: string[] = []
    const profile = this.currentProfile

    // Execution time recommendations
    if (profile.executionTime > 10000) {
      recommendations.push('Consider optimizing algorithm complexity - execution time exceeds 10 seconds')
    }

    // Memory recommendations
    if (profile.memoryUsage.peak > 100 * 1024 * 1024) { // 100MB
      recommendations.push('High memory usage detected - consider memory optimization techniques')
    }

    // Network recommendations
    if (profile.networkRequests.length > 10) {
      recommendations.push('Consider batching network requests or implementing caching')
    }

    // Code complexity recommendations
    if (profile.codeComplexity.cyclomatic > 10) {
      recommendations.push('High cyclomatic complexity - consider refactoring into smaller functions')
    }

    // Performance bottlenecks
    profile.performance.bottlenecks.forEach(bottleneck => {
      if (bottleneck.severity === 'high' || bottleneck.severity === 'critical') {
        recommendations.push(bottleneck.suggestion)
      }
    })

    return recommendations
  }

  private async initializeProfiling(): Promise<void> {
    // Initialize performance tracking
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Browser environment
      this.setupBrowserProfiling()
    } else {
      // Node.js environment (E2B sandbox)
      this.setupNodeProfiling()
    }
  }

  private setupBrowserProfiling(): void {
    // Setup performance observer for browser
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordStep('page_load', 'Page Load', 'initialization', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart
            })
          } else if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.recordNetworkRequest({
              url: resourceEntry.name,
              method: 'GET',
              duration: resourceEntry.duration,
              status: 200,
              size: resourceEntry.transferSize || 0,
              startTime: resourceEntry.startTime,
              endTime: resourceEntry.startTime + resourceEntry.duration
            })
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] })
    }
  }

  private setupNodeProfiling(): void {
    // Setup profiling for Node.js/E2B environment
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (err) => {
        this.recordStep('error', 'Process uncaughtException', 'execution', {
          error: err.message || 'Unknown error'
        });
      });
      process.on('unhandledRejection', (reason: any) => {
        this.recordStep('error', 'Process unhandledRejection', 'execution', {
          error: reason?.message || 'Unknown error'
        });
      });
    }
  }

  private setupPerformanceObserver(): void {
    // Setup performance observer if available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          if (!this.isProfilingActive) return
          
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              this.recordStep(
                entry.name,
                entry.name,
                'computation',
                {
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              )
            }
          })
        })
      } catch (error) {
        console.warn('Performance observer not available:', error)
      }
    }
  }

  private startMemoryMonitoring(): void {
    if (!this.isProfilingActive) return

    const interval = setInterval(() => {
      if (!this.isProfilingActive) {
        clearInterval(interval)
        return
      }

      const memoryUsage = this.getMemoryUsage()
      if (memoryUsage > 0) {
        this.memorySnapshots.push({
          timestamp: performance.now(),
          usage: memoryUsage
        })
      }
    }, 100) // Sample every 100ms
  }

  private stopMemoryMonitoring(): void {
    // Memory monitoring is stopped by the isProfilingActive flag
  }

  private startNetworkMonitoring(): void {
    if (typeof window !== 'undefined' && 'fetch' in window) {
      // Override fetch to monitor network requests
      const originalFetch = window.fetch
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const startTime = performance.now()
        const url = typeof input === 'string' ? input : input.toString()
        
        try {
          const response = await originalFetch(input, init)
          const endTime = performance.now()
          
          this.recordNetworkRequest({
            url,
            method: init?.method || 'GET',
            duration: endTime - startTime,
            status: response.status,
            size: parseInt(response.headers.get('content-length') || '0'),
            startTime,
            endTime
          })
          
          return response
        } catch (error) {
          const endTime = performance.now()
          
          this.recordNetworkRequest({
            url,
            method: init?.method || 'GET',
            duration: endTime - startTime,
            status: 0,
            size: 0,
            startTime,
            endTime
          })
          
          throw error
        }
      }
    }
  }

  private stopNetworkMonitoring(): void {
    // Network monitoring would be reset by restoring original fetch
    // This is a simplified implementation
  }

  private getMemoryUsage(): number {
    try {
      if (typeof window !== 'undefined' && 'performance' in window) {
        // Browser environment
        const memory = (performance as any).memory
        if (memory) {
          return memory.usedJSHeapSize
        }
      } else if (typeof process !== 'undefined') {
        // Node.js environment
        return process.memoryUsage().heapUsed
      }
    } catch (error) {
      console.warn('Memory usage not available:', error)
    }
    return 0
  }

  private getMemorySnapshot(): ExecutionStep['memorySnapshot'] {
    const usage = this.getMemoryUsage()
    return {
      used: usage,
      allocated: usage,
      freed: 0
    }
  }

  private async calculateMetrics(executionTime: number): Promise<ProfileMetrics> {
    const memoryUsages = this.memorySnapshots.map(s => s.usage)
    const networkDurations = this.networkRequests.map(r => r.duration)
    
    const memoryUsage = {
      peak: Math.max(...memoryUsages, 0),
      average: memoryUsages.reduce((a, b) => a + b, 0) / Math.max(memoryUsages.length, 1),
      initial: memoryUsages[0] || 0,
      final: memoryUsages[memoryUsages.length - 1] || 0
    }

    const codeComplexity = await this.calculateCodeComplexity()
    const bottlenecks = await this.identifyBottlenecks()
    const performanceScore = this.calculatePerformanceScore(executionTime, memoryUsage, bottlenecks)

    return {
      executionTime,
      memoryUsage,
      cpuUsage: {
        peak: 0, // Would require more sophisticated monitoring
        average: 0
      },
      networkRequests: this.networkRequests,
      codeComplexity,
      performance: {
        score: performanceScore,
        grade: this.getPerformanceGrade(performanceScore),
        bottlenecks
      },
      timeline: this.timeline,
      resourceUtilization: {
        cpu: { user: 0, system: 0, idle: 0 },
        memory: {
          heap: memoryUsage.peak,
          stack: 0,
          external: 0
        },
        io: { read: 0, write: 0, operations: 0 },
        network: {
          bytesReceived: this.networkRequests.reduce((sum, req) => sum + req.size, 0),
          bytesSent: 0,
          requests: this.networkRequests.length
        }
      }
    }
  }

  private async calculateCodeComplexity(): Promise<CodeComplexity> {
    if (!this.profilingContext) {
      return {
        cyclomatic: 0,
        cognitive: 0,
        linesOfCode: 0,
        functionsCount: 0,
        classesCount: 0,
        imports: 0,
        dependencies: []
      }
    }

    const code = this.profilingContext.fragment.code || ''
    const lines = code.split('\n')
    
    // Simple complexity calculation
    const cyclomatic = this.calculateCyclomaticComplexity(code)
    const cognitive = this.calculateCognitiveComplexity(code)
    const functionsCount = (code.match(/function\s+\w+|def\s+\w+|const\s+\w+\s*=/g) || []).length
    const classesCount = (code.match(/class\s+\w+/g) || []).length
    const imports = (code.match(/import\s+.*from|from\s+.*import/g) || []).length

    return {
      cyclomatic,
      cognitive,
      linesOfCode: lines.length,
      functionsCount,
      classesCount,
      imports,
      dependencies: this.extractDependencies(code)
    }
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Simple cyclomatic complexity calculation
    const patterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+.*:/g,
      /catch\s*\(/g,
      /&&|\|\|/g
    ]
    
    let complexity = 1 // Base complexity
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    })
    
    return complexity
  }

  private calculateCognitiveComplexity(code: string): number {
    // Simplified cognitive complexity calculation
    let complexity = 0
    let nestingLevel = 0
    
    const lines = code.split('\n')
    
    lines.forEach(line => {
      const trimmed = line.trim()
      
      // Increment nesting for control structures
      if (trimmed.match(/^(if|while|for|try|def|class|function)/)) {
        complexity += 1 + nestingLevel
        nestingLevel++
      } else if (trimmed.match(/^(else|elif|except|finally)/)) {
        complexity += 1
      } else if (trimmed.includes('}') || trimmed.includes('end')) {
        nestingLevel = Math.max(0, nestingLevel - 1)
      }
    })
    
    return complexity
  }

  private extractDependencies(code: string): string[] {
    const dependencies: string[] = []
    
    // Python imports
    const pythonImports = code.match(/(?:from\s+(\w+)|import\s+(\w+))/g)
    if (pythonImports) {
      pythonImports.forEach(imp => {
        const match = imp.match(/(?:from\s+(\w+)|import\s+(\w+))/)
        if (match) {
          dependencies.push(match[1] || match[2])
        }
      })
    }
    
    // JavaScript imports
    const jsImports = code.match(/import\s+.*from\s+['"]([^'"]+)['"]/g)
    if (jsImports) {
      jsImports.forEach(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/)
        if (match) {
          dependencies.push(match[1])
        }
      })
    }
    
    return Array.from(new Set(dependencies))
  }

  private async identifyBottlenecks(): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = []
    
    // Identify slow steps
    const slowSteps = this.timeline.filter(step => step.duration > 1000) // > 1 second
    slowSteps.forEach(step => {
      bottlenecks.push({
        type: 'cpu',
        severity: step.duration > 5000 ? 'critical' : 'high',
        description: `Slow execution in ${step.name}`,
        location: { line: 1, column: 1 },
        duration: step.duration,
        impact: (step.duration / this.timeline.reduce((sum, s) => sum + s.duration, 0)) * 100,
        suggestion: 'Consider optimizing this operation or implementing caching'
      })
    })
    
    // Identify memory issues
    const memoryGrowth = this.memorySnapshots.reduce((max, snapshot, index) => {
      if (index === 0) return 0
      const growth = snapshot.usage - this.memorySnapshots[index - 1].usage
      return Math.max(max, growth)
    }, 0)
    
    if (memoryGrowth > 10 * 1024 * 1024) { // 10MB growth
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: 'Significant memory growth detected',
        location: { line: 1, column: 1 },
        duration: 0,
        impact: 75,
        suggestion: 'Check for memory leaks or optimize data structures'
      })
    }
    
    // Identify network issues
    const slowRequests = this.networkRequests.filter(req => req.duration > 2000)
    slowRequests.forEach(req => {
      bottlenecks.push({
        type: 'network',
        severity: 'medium',
        description: `Slow network request to ${req.url}`,
        location: { line: 1, column: 1 },
        duration: req.duration,
        impact: 50,
        suggestion: 'Consider implementing request caching or optimization'
      })
    })
    
    return bottlenecks
  }

  private calculatePerformanceScore(
    executionTime: number,
    memoryUsage: ProfileMetrics['memoryUsage'],
    bottlenecks: PerformanceBottleneck[]
  ): number {
    let score = 100
    
    // Deduct points for execution time
    if (executionTime > 10000) score -= 30
    else if (executionTime > 5000) score -= 20
    else if (executionTime > 2000) score -= 10
    
    // Deduct points for memory usage
    if (memoryUsage.peak > 100 * 1024 * 1024) score -= 20
    else if (memoryUsage.peak > 50 * 1024 * 1024) score -= 10
    
    // Deduct points for bottlenecks
    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.severity) {
        case 'critical': score -= 25; break
        case 'high': score -= 15; break
        case 'medium': score -= 10; break
        case 'low': score -= 5; break
      }
    })
    
    return Math.max(0, Math.min(100, score))
  }

  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }
}

// Export singleton instance
export const executionProfiler = new ExecutionProfiler()
