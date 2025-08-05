import { CoreMessage } from 'ai'
import { TemplateId } from './templates'

export interface WorkflowDetectionResult {
  isWorkflow: boolean
  confidence: number
  suggestedName?: string
  suggestedDescription?: string
  suggestedSteps?: WorkflowStep[]
  reason?: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  template: TemplateId
  dependencies: string[]
  estimatedDuration?: number
}

export class WorkflowDetector {
  private workflowKeywords = [
    'multi-step', 'pipeline', 'workflow', 'process', 'then', 'after that',
    'next', 'following', 'sequence', 'stages', 'phases', 'steps',
    'first do', 'then do', 'finally', 'chain', 'automation'
  ]

  private complexityIndicators = [
    'analyze and then', 'process and display', 'fetch and transform',
    'create multiple', 'build several', 'integrate with', 'connect to',
    'data pipeline', 'etl', 'dashboard', 'full-stack', 'end-to-end'
  ]

  private templateIndicators: Record<string, TemplateId[]> = {
    'data analysis': ['code-interpreter-v1'],
    'visualization': ['code-interpreter-v1', 'streamlit-developer'],
    'web app': ['nextjs-developer', 'vue-developer'],
    'dashboard': ['streamlit-developer', 'gradio-developer', 'nextjs-developer'],
    'api': ['nextjs-developer'],
    'frontend': ['nextjs-developer', 'vue-developer'],
    'backend': ['nextjs-developer'],
    'machine learning': ['code-interpreter-v1', 'streamlit-developer'],
    'chart': ['code-interpreter-v1', 'streamlit-developer'],
    'graph': ['code-interpreter-v1', 'streamlit-developer'],
    'plot': ['code-interpreter-v1', 'streamlit-developer']
  }

  detectWorkflow(messages: CoreMessage[]): WorkflowDetectionResult {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return { isWorkflow: false, confidence: 0 }
    }

    const content = typeof lastMessage.content === 'string' 
      ? lastMessage.content.toLowerCase() 
      : ''

    // Calculate workflow indicators
    const workflowScore = this.calculateWorkflowScore(content)
    const complexityScore = this.calculateComplexityScore(content)
    
    // Determine if this should be a workflow
    const totalScore = (workflowScore * 0.6) + (complexityScore * 0.4)
    const isWorkflow = totalScore > 0.3

    if (!isWorkflow) {
      return { 
        isWorkflow: false, 
        confidence: totalScore,
        reason: 'Request appears to be a single-step task'
      }
    }

    // Generate workflow suggestions
    const steps = this.suggestWorkflowSteps(content)
    const name = this.suggestWorkflowName(content)
    const description = this.suggestWorkflowDescription(content)

    return {
      isWorkflow: true,
      confidence: totalScore,
      suggestedName: name,
      suggestedDescription: description,
      suggestedSteps: steps,
      reason: `Detected ${steps.length} potential steps in the request`
    }
  }

  private calculateWorkflowScore(content: string): number {
    let score = 0
    let matchCount = 0

    for (const keyword of this.workflowKeywords) {
      if (content.includes(keyword)) {
        matchCount++
        score += 0.1
      }
    }

    // Bonus for multiple workflow indicators
    if (matchCount > 2) score += 0.2
    if (matchCount > 4) score += 0.3

    return Math.min(score, 1.0)
  }

  private calculateComplexityScore(content: string): number {
    let score = 0
    
    // Check for complexity indicators
    for (const indicator of this.complexityIndicators) {
      if (content.includes(indicator)) {
        score += 0.2
      }
    }

    // Check for multiple technologies/templates mentioned
    const templatesDetected = new Set<TemplateId>()
    for (const [keyword, templates] of Object.entries(this.templateIndicators)) {
      if (content.includes(keyword)) {
        templates.forEach(template => templatesDetected.add(template))
      }
    }

    if (templatesDetected.size > 1) {
      score += 0.3
    }

    // Check for sequential words
    const sequentialWords = ['first', 'second', 'third', 'then', 'next', 'after', 'finally']
    let sequentialCount = 0
    for (const word of sequentialWords) {
      if (content.includes(word)) sequentialCount++
    }
    
    if (sequentialCount > 1) score += 0.2

    return Math.min(score, 1.0)
  }

  private suggestWorkflowSteps(content: string): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    
    // Analyze content for potential steps
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    let stepId = 1
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim().toLowerCase()
      
      // Skip very short sentences
      if (cleanSentence.length < 20) continue
      
      // Detect template for this step
      const template = this.detectTemplateForStep(cleanSentence)
      if (!template) continue

      const step: WorkflowStep = {
        id: `step_${stepId}`,
        name: this.generateStepName(cleanSentence),
        description: sentence.trim(),
        template,
        dependencies: stepId > 1 ? [`step_${stepId - 1}`] : [],
        estimatedDuration: this.estimateDuration(template)
      }

      steps.push(step)
      stepId++

      // Limit to 5 steps to avoid overwhelming the user
      if (steps.length >= 5) break
    }

    return steps
  }

  private detectTemplateForStep(content: string): TemplateId | null {
    const scores: Record<TemplateId, number> = {
      'code-interpreter-v1': 0,
      'nextjs-developer': 0,
      'vue-developer': 0,
      'streamlit-developer': 0,
      'gradio-developer': 0,
      'codinit-engineer': 0
    }

    // Score each template based on keywords
    for (const [keyword, templates] of Object.entries(this.templateIndicators)) {
      if (content.includes(keyword)) {
        templates.forEach(template => {
          scores[template] += 1
        })
      }
    }

    // Additional specific scoring
    if (content.includes('analyze') || content.includes('data') || content.includes('python')) {
      scores['code-interpreter-v1'] += 2
    }
    
    if (content.includes('web') || content.includes('app') || content.includes('react') || content.includes('next')) {
      scores['nextjs-developer'] += 2
    }
    
    if (content.includes('vue') || content.includes('nuxt')) {
      scores['vue-developer'] += 2
    }
    
    if (content.includes('dashboard') || content.includes('streamlit') || content.includes('ui')) {
      scores['streamlit-developer'] += 2
    }
    
    if (content.includes('gradio') || content.includes('interface')) {
      scores['gradio-developer'] += 2
    }

    // Find template with highest score
    const bestTemplate = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)[0]

    return bestTemplate ? bestTemplate[0] as TemplateId : 'code-interpreter-v1'
  }

  private generateStepName(content: string): string {
    // Extract key action words
    const actionWords = content.match(/\b(create|build|analyze|process|generate|fetch|transform|display|show|calculate|plot|chart)\b/g)
    const objectWords = content.match(/\b(data|app|dashboard|chart|graph|api|interface|website|model|analysis)\b/g)
    
    const action = actionWords?.[0] || 'Process'
    const object = objectWords?.[0] || 'Data'
    
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${object.charAt(0).toUpperCase() + object.slice(1)}`
  }

  private estimateDuration(template: TemplateId): number {
    // Estimated duration in minutes based on template complexity
    const durations: Record<TemplateId, number> = {
      'code-interpreter-v1': 2,
      'nextjs-developer': 5,
      'vue-developer': 5,
      'streamlit-developer': 3,
      'gradio-developer': 3,
      'codinit-engineer': 10
    }
    
    return durations[template] || 3
  }

  private suggestWorkflowName(content: string): string {
    const words = content.toLowerCase().split(' ')
    const keyWords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'they', 'them', 'have', 'will', 'make', 'take'].includes(word)
    ).slice(0, 3)
    
    return keyWords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') + ' Workflow'
  }

  private suggestWorkflowDescription(content: string): string {
    // Take first sentence or first 100 characters
    const firstSentence = content.split(/[.!?]/)[0]
    return firstSentence.length > 100 
      ? firstSentence.substring(0, 97) + '...'
      : firstSentence
  }
}

export const workflowDetector = new WorkflowDetector()