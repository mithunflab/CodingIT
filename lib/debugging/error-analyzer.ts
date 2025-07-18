import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { TemplateId } from '@/lib/templates'

export interface ErrorAnalysis {
  id: string
  errorType: ErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  suggestions: ErrorSuggestion[]
  codeContext: {
    line: number
    column: number
    snippet: string
    highlightedCode?: string
  }
  stackTrace?: string[]
  documentation?: {
    title: string
    url: string
    description: string
  }[]
  aiSuggestion?: string
  quickFixes?: QuickFix[]
  relatedErrors?: string[]
  category: ErrorCategory
}

export interface ErrorSuggestion {
  id: string
  title: string
  description: string
  code?: string
  confidence: number
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  steps: string[]
  resources?: {
    title: string
    url: string
    type: 'documentation' | 'tutorial' | 'example'
  }[]
}

export interface QuickFix {
  id: string
  title: string
  description: string
  action: 'replace' | 'insert' | 'delete' | 'wrap'
  target: {
    line: number
    column: number
    length?: number
  }
  replacement?: string
  confidence: number
  automatic: boolean
}

export enum ErrorType {
  SYNTAX_ERROR = 'syntax_error',
  RUNTIME_ERROR = 'runtime_error',
  IMPORT_ERROR = 'import_error',
  TYPE_ERROR = 'type_error',
  LOGICAL_ERROR = 'logical_error',
  PERFORMANCE_ERROR = 'performance_error',
  SECURITY_ERROR = 'security_error',
  DEPENDENCY_ERROR = 'dependency_error',
  CONFIGURATION_ERROR = 'configuration_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error'
}

export enum ErrorCategory {
  CODE = 'code',
  ENVIRONMENT = 'environment',
  DEPENDENCY = 'dependency',
  CONFIGURATION = 'configuration',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  NETWORK = 'network',
  SYSTEM = 'system'
}

export interface ErrorPattern {
  pattern: RegExp
  type: ErrorType
  category: ErrorCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  handler: (match: RegExpMatchArray, context: ErrorContext) => ErrorAnalysis
}

export interface ErrorContext {
  fragment: FragmentSchema
  template: TemplateId
  executionResult: ExecutionResult
  code: string
  line?: number
  column?: number
  environment?: Record<string, string>
}

export class ErrorAnalyzer {
  private errorPatterns: ErrorPattern[] = []
  private knowledgeBase: Map<string, ErrorAnalysis[]> = new Map()
  private aiProvider?: (prompt: string) => Promise<string>

  constructor(aiProvider?: (prompt: string) => Promise<string>) {
    this.aiProvider = aiProvider
    this.initializeErrorPatterns()
    this.loadKnowledgeBase()
  }

  async analyzeError(
    error: Error | string,
    context: ErrorContext
  ): Promise<ErrorAnalysis> {
    const errorMessage = error instanceof Error ? error.message : error
    const stackTrace = error instanceof Error ? error.stack?.split('\n') : undefined

    // Try to match known error patterns
    const patternMatch = this.matchErrorPattern(errorMessage, context)
    if (patternMatch) {
      return await this.enhanceWithAI(patternMatch, context)
    }

    // Generate generic analysis
    const analysis = await this.generateGenericAnalysis(errorMessage, context, stackTrace)
    return await this.enhanceWithAI(analysis, context)
  }

  async analyzeCode(fragment: FragmentSchema): Promise<ErrorAnalysis[]> {
    const issues: ErrorAnalysis[] = []
    const code = fragment.code || ''

    // Static analysis
    issues.push(...await this.performStaticAnalysis(code, fragment))
    
    // Pattern-based analysis
    issues.push(...await this.performPatternAnalysis(code, fragment))
    
    // AI-powered analysis
    if (this.aiProvider) {
      issues.push(...await this.performAIAnalysis(code, fragment))
    }

    return issues.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity))
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      // Python errors
      {
        pattern: /ModuleNotFoundError: No module named '(.+)'/,
        type: ErrorType.IMPORT_ERROR,
        category: ErrorCategory.DEPENDENCY,
        severity: 'high',
        handler: (match, context) => this.createImportErrorAnalysis(match[1], context)
      },
      {
        pattern: /SyntaxError: (.+) \(line (\d+)\)/,
        type: ErrorType.SYNTAX_ERROR,
        category: ErrorCategory.CODE,
        severity: 'high',
        handler: (match, context) => this.createSyntaxErrorAnalysis(match[1], parseInt(match[2]), context)
      },
      {
        pattern: /IndentationError: (.+)/,
        type: ErrorType.SYNTAX_ERROR,
        category: ErrorCategory.CODE,
        severity: 'medium',
        handler: (match, context) => this.createIndentationErrorAnalysis(match[1], context)
      },
      {
        pattern: /TypeError: (.+)/,
        type: ErrorType.TYPE_ERROR,
        category: ErrorCategory.CODE,
        severity: 'medium',
        handler: (match, context) => this.createTypeErrorAnalysis(match[1], context)
      },
      {
        pattern: /NameError: name '(.+)' is not defined/,
        type: ErrorType.RUNTIME_ERROR,
        category: ErrorCategory.CODE,
        severity: 'medium',
        handler: (match, context) => this.createNameErrorAnalysis(match[1], context)
      },
      
      // JavaScript/TypeScript errors
      {
        pattern: /ReferenceError: (.+) is not defined/,
        type: ErrorType.RUNTIME_ERROR,
        category: ErrorCategory.CODE,
        severity: 'medium',
        handler: (match, context) => this.createReferenceErrorAnalysis(match[1], context)
      },
      {
        pattern: /Cannot find module '(.+)'/,
        type: ErrorType.IMPORT_ERROR,
        category: ErrorCategory.DEPENDENCY,
        severity: 'high',
        handler: (match, context) => this.createModuleNotFoundAnalysis(match[1], context)
      },
      {
        pattern: /Unexpected token (.+)/,
        type: ErrorType.SYNTAX_ERROR,
        category: ErrorCategory.CODE,
        severity: 'high',
        handler: (match, context) => this.createUnexpectedTokenAnalysis(match[1], context)
      },

      // Network errors
      {
        pattern: /fetch failed|Network request failed|ECONNREFUSED/,
        type: ErrorType.NETWORK_ERROR,
        category: ErrorCategory.NETWORK,
        severity: 'medium',
        handler: (match, context) => this.createNetworkErrorAnalysis(match[0], context)
      },

      // Timeout errors
      {
        pattern: /timeout|TimeoutError/,
        type: ErrorType.TIMEOUT_ERROR,
        category: ErrorCategory.PERFORMANCE,
        severity: 'medium',
        handler: (match, context) => this.createTimeoutErrorAnalysis(match[0], context)
      },

      // Memory errors
      {
        pattern: /MemoryError|out of memory|heap out of memory/,
        type: ErrorType.MEMORY_ERROR,
        category: ErrorCategory.SYSTEM,
        severity: 'critical',
        handler: (match, context) => this.createMemoryErrorAnalysis(match[0], context)
      }
    ]
  }

  private loadKnowledgeBase(): void {
    // Load common error patterns and solutions
    this.knowledgeBase.set('module_not_found', [
      // Common Python module errors
    ])
    this.knowledgeBase.set('syntax_errors', [
      // Common syntax error patterns
    ])
    this.knowledgeBase.set('type_errors', [
      // Common type error patterns
    ])
  }

  private matchErrorPattern(errorMessage: string, context: ErrorContext): ErrorAnalysis | null {
    for (const pattern of this.errorPatterns) {
      const match = errorMessage.match(pattern.pattern)
      if (match) {
        return pattern.handler(match, context)
      }
    }
    return null
  }

  private async generateGenericAnalysis(
    errorMessage: string,
    context: ErrorContext,
    stackTrace?: string[]
  ): Promise<ErrorAnalysis> {
    const analysis: ErrorAnalysis = {
      id: `error_${Date.now()}`,
      errorType: ErrorType.RUNTIME_ERROR,
      severity: 'medium',
      title: 'Runtime Error',
      description: errorMessage,
      suggestions: [],
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      stackTrace,
      category: ErrorCategory.CODE,
      quickFixes: []
    }

    // Add basic suggestions
    analysis.suggestions.push({
      id: 'check_syntax',
      title: 'Check Syntax',
      description: 'Review your code for syntax errors',
      confidence: 0.7,
      difficulty: 'easy',
      estimatedTime: '2-5 minutes',
      steps: [
        'Review the highlighted line for syntax errors',
        'Check for missing parentheses, brackets, or quotes',
        'Ensure proper indentation'
      ]
    })

    return analysis
  }

  private createImportErrorAnalysis(module: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'install_module',
        title: `Install ${module}`,
        description: `Install the missing ${module} module`,
        code: this.getInstallCommand(module, context.template),
        confidence: 0.9,
        difficulty: 'easy',
        estimatedTime: '1-2 minutes',
        steps: [
          `Run: ${this.getInstallCommand(module, context.template)}`,
          'Restart your application',
          'Try running the code again'
        ],
        resources: [
          {
            title: `${module} Documentation`,
            url: this.getModuleDocumentationUrl(module),
            type: 'documentation'
          }
        ]
      }
    ]

    const quickFixes: QuickFix[] = [
      {
        id: 'add_install_comment',
        title: 'Add installation comment',
        description: 'Add a comment with installation instructions',
        action: 'insert',
        target: { line: 1, column: 1 },
        replacement: `# Install: ${this.getInstallCommand(module, context.template)}\n`,
        confidence: 0.8,
        automatic: true
      }
    ]

    return {
      id: `import_error_${Date.now()}`,
      errorType: ErrorType.IMPORT_ERROR,
      severity: 'high',
      title: `Module '${module}' not found`,
      description: `The module '${module}' is not installed or not available in the current environment.`,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      quickFixes,
      category: ErrorCategory.DEPENDENCY,
      documentation: [
        {
          title: 'Python Module Installation',
          url: 'https://docs.python.org/3/installing/index.html',
          description: 'Official Python installation guide'
        }
      ]
    }
  }

  private createSyntaxErrorAnalysis(message: string, line: number, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'fix_syntax',
        title: 'Fix Syntax Error',
        description: 'Review and fix the syntax error',
        confidence: 0.8,
        difficulty: 'easy',
        estimatedTime: '1-3 minutes',
        steps: [
          'Check for missing or extra parentheses, brackets, or quotes',
          'Ensure proper indentation',
          'Review the line for typos',
          'Check for missing colons after if/for/while statements'
        ]
      }
    ]

    const quickFixes = this.generateSyntaxQuickFixes(message, line, context)

    return {
      id: `syntax_error_${Date.now()}`,
      errorType: ErrorType.SYNTAX_ERROR,
      severity: 'high',
      title: 'Syntax Error',
      description: message,
      suggestions,
      codeContext: {
        line,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, line),
        highlightedCode: this.highlightSyntaxError(context.code, line)
      },
      quickFixes,
      category: ErrorCategory.CODE
    }
  }

  private createTypeErrorAnalysis(message: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'check_types',
        title: 'Check Variable Types',
        description: 'Verify that variables are of the expected type',
        confidence: 0.7,
        difficulty: 'medium',
        estimatedTime: '3-5 minutes',
        steps: [
          'Check the types of variables involved in the operation',
          'Add type checking or conversion if needed',
          'Review function parameters and return types'
        ]
      }
    ]

    return {
      id: `type_error_${Date.now()}`,
      errorType: ErrorType.TYPE_ERROR,
      severity: 'medium',
      title: 'Type Error',
      description: message,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.CODE
    }
  }

  private createNameErrorAnalysis(variableName: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'define_variable',
        title: `Define ${variableName}`,
        description: `Define the variable '${variableName}' before using it`,
        confidence: 0.8,
        difficulty: 'easy',
        estimatedTime: '1-2 minutes',
        steps: [
          `Add a definition for '${variableName}' before it's used`,
          'Check for typos in the variable name',
          'Ensure the variable is in the correct scope'
        ]
      }
    ]

    const quickFixes: QuickFix[] = [
      {
        id: 'add_variable_definition',
        title: 'Add variable definition',
        description: `Add a definition for '${variableName}'`,
        action: 'insert',
        target: { line: (context.line || 1) - 1, column: 1 },
        replacement: `${variableName} = None  # Define ${variableName}\n`,
        confidence: 0.6,
        automatic: false
      }
    ]

    return {
      id: `name_error_${Date.now()}`,
      errorType: ErrorType.RUNTIME_ERROR,
      severity: 'medium',
      title: `Variable '${variableName}' not defined`,
      description: `The variable '${variableName}' is used but not defined.`,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      quickFixes,
      category: ErrorCategory.CODE
    }
  }

  private createReferenceErrorAnalysis(variableName: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'declare_variable',
        title: `Declare ${variableName}`,
        description: `Declare the variable '${variableName}' before using it`,
        confidence: 0.8,
        difficulty: 'easy',
        estimatedTime: '1-2 minutes',
        steps: [
          `Add a declaration for '${variableName}' before it's used`,
          'Check for typos in the variable name',
          'Ensure the variable is in the correct scope'
        ]
      }
    ]

    return {
      id: `reference_error_${Date.now()}`,
      errorType: ErrorType.RUNTIME_ERROR,
      severity: 'medium',
      title: `'${variableName}' is not defined`,
      description: `The variable '${variableName}' is used but not declared.`,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.CODE
    }
  }

  private createModuleNotFoundAnalysis(module: string, context: ErrorContext): ErrorAnalysis {
    return this.createImportErrorAnalysis(module, context)
  }

  private createUnexpectedTokenAnalysis(token: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'fix_unexpected_token',
        title: 'Fix Unexpected Token',
        description: `Remove or fix the unexpected token '${token}'`,
        confidence: 0.7,
        difficulty: 'medium',
        estimatedTime: '2-5 minutes',
        steps: [
          'Check for missing or extra punctuation',
          'Ensure proper syntax structure',
          'Review parentheses and bracket matching'
        ]
      }
    ]

    return {
      id: `unexpected_token_${Date.now()}`,
      errorType: ErrorType.SYNTAX_ERROR,
      severity: 'high',
      title: 'Unexpected Token',
      description: `Unexpected token '${token}' found in code.`,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.CODE
    }
  }

  private createNetworkErrorAnalysis(error: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'check_network',
        title: 'Check Network Connection',
        description: 'Verify network connectivity and endpoint availability',
        confidence: 0.6,
        difficulty: 'medium',
        estimatedTime: '5-10 minutes',
        steps: [
          'Check internet connectivity',
          'Verify the API endpoint is accessible',
          'Check for firewall or proxy issues',
          'Add proper error handling for network requests'
        ]
      }
    ]

    return {
      id: `network_error_${Date.now()}`,
      errorType: ErrorType.NETWORK_ERROR,
      severity: 'medium',
      title: 'Network Error',
      description: 'Network request failed or connection was refused.',
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.NETWORK
    }
  }

  private createTimeoutErrorAnalysis(error: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'increase_timeout',
        title: 'Increase Timeout',
        description: 'Increase the timeout duration for the operation',
        confidence: 0.7,
        difficulty: 'easy',
        estimatedTime: '2-3 minutes',
        steps: [
          'Increase the timeout value in your code',
          'Add timeout configuration',
          'Consider optimizing the operation for better performance'
        ]
      }
    ]

    return {
      id: `timeout_error_${Date.now()}`,
      errorType: ErrorType.TIMEOUT_ERROR,
      severity: 'medium',
      title: 'Timeout Error',
      description: 'Operation timed out before completion.',
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.PERFORMANCE
    }
  }

  private createMemoryErrorAnalysis(error: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'optimize_memory',
        title: 'Optimize Memory Usage',
        description: 'Reduce memory consumption in your code',
        confidence: 0.8,
        difficulty: 'hard',
        estimatedTime: '15-30 minutes',
        steps: [
          'Identify memory-intensive operations',
          'Use generators instead of lists where possible',
          'Free up unused variables',
          'Process data in chunks instead of loading all at once'
        ]
      }
    ]

    return {
      id: `memory_error_${Date.now()}`,
      errorType: ErrorType.MEMORY_ERROR,
      severity: 'critical',
      title: 'Memory Error',
      description: 'Application ran out of memory.',
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.SYSTEM
    }
  }

  private createIndentationErrorAnalysis(message: string, context: ErrorContext): ErrorAnalysis {
    const suggestions: ErrorSuggestion[] = [
      {
        id: 'fix_indentation',
        title: 'Fix Indentation',
        description: 'Correct the indentation in your code',
        confidence: 0.9,
        difficulty: 'easy',
        estimatedTime: '1-2 minutes',
        steps: [
          'Use consistent indentation (4 spaces or 1 tab)',
          'Check for mixed tabs and spaces',
          'Ensure proper nesting of code blocks'
        ]
      }
    ]

    return {
      id: `indentation_error_${Date.now()}`,
      errorType: ErrorType.SYNTAX_ERROR,
      severity: 'medium',
      title: 'Indentation Error',
      description: message,
      suggestions,
      codeContext: {
        line: context.line || 1,
        column: context.column || 1,
        snippet: this.extractCodeSnippet(context.code, context.line || 1)
      },
      category: ErrorCategory.CODE
    }
  }

  private async performStaticAnalysis(code: string, fragment: FragmentSchema): Promise<ErrorAnalysis[]> {
    const issues: ErrorAnalysis[] = []
    const lines = code.split('\n')

    // Check for common issues
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      
      // Check for long lines
      if (line.length > 120) {
        issues.push({
          id: `long_line_${lineNumber}`,
          errorType: ErrorType.LOGICAL_ERROR,
          severity: 'low',
          title: 'Long Line',
          description: `Line ${lineNumber} is too long (${line.length} characters)`,
          suggestions: [{
            id: 'break_line',
            title: 'Break Long Line',
            description: 'Break the line into multiple shorter lines',
            confidence: 0.8,
            difficulty: 'easy',
            estimatedTime: '1-2 minutes',
            steps: ['Break the line at logical points', 'Use line continuation if needed']
          }],
          codeContext: {
            line: lineNumber,
            column: 1,
            snippet: line
          },
          category: ErrorCategory.CODE
        })
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          id: `todo_${lineNumber}`,
          errorType: ErrorType.LOGICAL_ERROR,
          severity: 'low',
          title: 'TODO Comment',
          description: `TODO or FIXME comment found on line ${lineNumber}`,
          suggestions: [{
            id: 'resolve_todo',
            title: 'Resolve TODO',
            description: 'Complete the TODO item or remove the comment',
            confidence: 0.6,
            difficulty: 'medium',
            estimatedTime: '5-15 minutes',
            steps: ['Implement the TODO item', 'Remove the comment when done']
          }],
          codeContext: {
            line: lineNumber,
            column: 1,
            snippet: line
          },
          category: ErrorCategory.CODE
        })
      }
    })

    return issues
  }

  private async performPatternAnalysis(code: string, fragment: FragmentSchema): Promise<ErrorAnalysis[]> {
    const issues: ErrorAnalysis[] = []
    
    // Check for security issues
    if (code.includes('eval(') || code.includes('exec(')) {
      issues.push({
        id: `security_eval_${Date.now()}`,
        errorType: ErrorType.SECURITY_ERROR,
        severity: 'critical',
        title: 'Security Risk: eval() or exec()',
        description: 'Using eval() or exec() can be dangerous and should be avoided',
        suggestions: [{
          id: 'remove_eval',
          title: 'Remove eval/exec',
          description: 'Replace eval() or exec() with safer alternatives',
          confidence: 0.9,
          difficulty: 'medium',
          estimatedTime: '10-20 minutes',
          steps: [
            'Identify what eval/exec is trying to do',
            'Replace with safer alternatives',
            'Use ast.literal_eval() for safe evaluation if needed'
          ]
        }],
        codeContext: {
          line: 1,
          column: 1,
          snippet: code.substring(0, 100)
        },
        category: ErrorCategory.SECURITY
      })
    }

    return issues
  }

  private async performAIAnalysis(code: string, fragment: FragmentSchema): Promise<ErrorAnalysis[]> {
    if (!this.aiProvider) return []

    try {
      const prompt = `Analyze this ${fragment.template} code for potential issues, bugs, or improvements:

\`\`\`${this.getLanguageFromTemplate(fragment.template)}
${code}
\`\`\`

Please identify:
1. Potential runtime errors
2. Logic errors
3. Performance issues
4. Security vulnerabilities
5. Best practice violations

Return a JSON array of issues with structure: {type, severity, title, description, line, suggestion}`

      const response = await this.aiProvider(prompt)
      const aiIssues = JSON.parse(response)

      return aiIssues.map((issue: any, index: number) => ({
        id: `ai_issue_${index}`,
        errorType: this.mapAIErrorType(issue.type),
        severity: issue.severity || 'medium',
        title: issue.title,
        description: issue.description,
        aiSuggestion: issue.suggestion,
        suggestions: [{
          id: `ai_suggestion_${index}`,
          title: 'AI Suggestion',
          description: issue.suggestion,
          confidence: 0.7,
          difficulty: 'medium',
          estimatedTime: '5-10 minutes',
          steps: [issue.suggestion]
        }],
        codeContext: {
          line: issue.line || 1,
          column: 1,
          snippet: this.extractCodeSnippet(code, issue.line || 1)
        },
        category: ErrorCategory.CODE
      }))
    } catch (error) {
      console.error('AI analysis failed:', error)
      return []
    }
  }

  private async enhanceWithAI(analysis: ErrorAnalysis, context: ErrorContext): Promise<ErrorAnalysis> {
    if (!this.aiProvider) return analysis

    try {
      const prompt = `Given this error analysis, provide an improved explanation and additional suggestions:

Error: ${analysis.title}
Description: ${analysis.description}
Code context: ${analysis.codeContext.snippet}
Template: ${context.template}

Please provide:
1. A clearer explanation of the error
2. Step-by-step debugging approach
3. Alternative solutions
4. Prevention strategies

Return JSON with: {explanation, debuggingSteps, alternatives, prevention}`

      const response = await this.aiProvider(prompt)
      const aiEnhancement = JSON.parse(response)

      return {
        ...analysis,
        description: aiEnhancement.explanation || analysis.description,
        aiSuggestion: aiEnhancement.debuggingSteps?.join('\n'),
        suggestions: [
          ...analysis.suggestions,
          ...((aiEnhancement.alternatives || []).map((alt: string, index: number) => ({
            id: `ai_alternative_${index}`,
            title: `Alternative Solution ${index + 1}`,
            description: alt,
            confidence: 0.6,
            difficulty: 'medium',
            estimatedTime: '5-10 minutes',
            steps: [alt]
          })))
        ]
      }
    } catch (error) {
      console.error('AI enhancement failed:', error)
      return analysis
    }
  }

  private generateSyntaxQuickFixes(message: string, line: number, context: ErrorContext): QuickFix[] {
    const fixes: QuickFix[] = []
    
    if (message.includes('missing') && message.includes(':')) {
      fixes.push({
        id: 'add_colon',
        title: 'Add missing colon',
        description: 'Add a colon at the end of the line',
        action: 'insert',
        target: { line, column: context.code.split('\n')[line - 1]?.length || 1 },
        replacement: ':',
        confidence: 0.8,
        automatic: true
      })
    }

    return fixes
  }

  private extractCodeSnippet(code: string, line: number, context: number = 2): string {
    const lines = code.split('\n')
    const start = Math.max(0, line - context - 1)
    const end = Math.min(lines.length, line + context)
    
    return lines.slice(start, end)
      .map((l, i) => `${start + i + 1}: ${l}`)
      .join('\n')
  }

  private highlightSyntaxError(code: string, line: number): string {
    const lines = code.split('\n')
    return lines.map((l, i) => {
      if (i === line - 1) {
        return `>>> ${l} <<<`
      }
      return l
    }).join('\n')
  }

  private getInstallCommand(module: string, template: TemplateId): string {
    if (template.includes('python') || template.includes('streamlit') || template.includes('gradio')) {
      return `pip install ${module}`
    } else {
      return `npm install ${module}`
    }
  }

  private getModuleDocumentationUrl(module: string): string {
    const commonUrls: Record<string, string> = {
      'pandas': 'https://pandas.pydata.org/docs/',
      'numpy': 'https://numpy.org/doc/',
      'matplotlib': 'https://matplotlib.org/stable/',
      'streamlit': 'https://docs.streamlit.io/',
      'gradio': 'https://gradio.app/docs/',
      'react': 'https://reactjs.org/docs/',
      'vue': 'https://vuejs.org/guide/'
    }
    
    return commonUrls[module] || `https://pypi.org/project/${module}/`
  }

  private getLanguageFromTemplate(template: string): string {
    const languageMap: Record<string, string> = {
      'streamlit-developer': 'python',
      'gradio-developer': 'python',
      'code-interpreter-v1': 'python',
      'nextjs-developer': 'javascript',
      'vue-developer': 'javascript'
    }
    
    return languageMap[template] || 'text'
  }

  private mapAIErrorType(type: string): ErrorType {
    const mapping: Record<string, ErrorType> = {
      'runtime': ErrorType.RUNTIME_ERROR,
      'logic': ErrorType.LOGICAL_ERROR,
      'performance': ErrorType.PERFORMANCE_ERROR,
      'security': ErrorType.SECURITY_ERROR,
      'syntax': ErrorType.SYNTAX_ERROR,
      'type': ErrorType.TYPE_ERROR
    }
    
    return mapping[type] || ErrorType.LOGICAL_ERROR
  }

  private getSeverityScore(severity: string): number {
    const scores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    }
    
    return scores[severity as keyof typeof scores] || 2
  }
}

// Export singleton instance
export const errorAnalyzer = new ErrorAnalyzer()
