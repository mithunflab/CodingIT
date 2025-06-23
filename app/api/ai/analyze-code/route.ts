import { NextRequest, NextResponse } from 'next/server'

interface CodeAnalysisRequest {
  code: string
  language: string
  file: string
  cursorPosition: { line: number; column: number }
  model: any // LLMModel
  config: any
}

interface CodeSuggestion {
  id: string
  type: 'completion' | 'refactor' | 'fix' | 'optimize'
  line: number
  column: number
  text: string
  replacement: string
  confidence: number
  description: string
}

interface Diagnostic {
  id: string
  type: 'error' | 'warning' | 'info'
  line: number
  column: number
  message: string
  suggestion?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = require('@/lib/supabase').supabase
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CodeAnalysisRequest = await request.json()
    const { code, language, file, cursorPosition, model, config } = body

    if (!code || !language || !model || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Analyze code using AI
    const analysis = await analyzeCodeWithAI(code, language, file, cursorPosition, model, config)

    return NextResponse.json({
      suggestions: analysis.suggestions,
      diagnostics: analysis.diagnostics,
      metrics: analysis.metrics
    })

  } catch (error) {
    console.error('Code analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    )
  }
}

async function analyzeCodeWithAI(
  code: string,
  language: string,
  file: string,
  cursorPosition: { line: number; column: number },
  model: any, // LLMModel
  config: any // LLMModelConfig
): Promise<{
  suggestions: CodeSuggestion[]
  diagnostics: Diagnostic[]
  metrics: any
}> {
  const lines = code.split('\n')
  const currentLine = lines[cursorPosition.line - 1] || ''

  try {
    const { E2BToolClient, E2BToolType } = require('@/lib/e2b/toolClient')
    const e2bToolClient = new E2BToolClient()

    const result = await e2bToolClient.execute({
      toolType: 'new_task' as any, //E2BToolType,
      userInput: `Analyze this ${language} code from file "${file}":\n\`\`\`${language}\n${code}\n\`\`\`\nCurrent cursor position: Line ${cursorPosition.line}, Column ${cursorPosition.column}\nCurrent line context: "${currentLine}"\n\nProvide analysis focusing on the area around the cursor and overall code quality.`,
      model: model,
      config: config,
      userID: 'user-id', // Replace with actual user ID
      teamID: 'team-id', // Replace with actual team ID
    })

    if (!result.success) {
      throw new Error(result.executionResult.toolResponse || 'Code analysis failed')
    }

    const analysisText = result.executionResult.aiResponse

    if (!analysisText) {
      throw new Error('No analysis returned from AI')
    }

    // Parse the JSON response
    try {
      const analysis = JSON.parse(analysisText)

      // Add IDs if missing
      analysis.suggestions = analysis.suggestions?.map((s: any, i: number) => ({
        ...s,
        id: s.id || `suggestion-${Date.now()}-${i}`
      })) || []

      analysis.diagnostics = analysis.diagnostics?.map((d: any, i: number) => ({
        ...d,
        id: d.id || `diagnostic-${Date.now()}-${i}`
      })) || []

      return {
        suggestions: analysis.suggestions,
        diagnostics: analysis.diagnostics,
        metrics: {
          complexity: calculateComplexity(code),
          linesOfCode: lines.length,
          analysisTimestamp: new Date().toISOString()
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError)
      return {
        suggestions: [],
        diagnostics: [],
        metrics: {
          complexity: calculateComplexity(code),
          linesOfCode: lines.length,
          analysisTimestamp: new Date().toISOString()
        }
      }
    }

  } catch (error) {
    console.error('AI analysis failed:', error)
    return {
      suggestions: [],
      diagnostics: [],
      metrics: {
        complexity: calculateComplexity(code),
        linesOfCode: lines.length,
        analysisTimestamp: new Date().toISOString()
      }
    }
  }
}

function calculateComplexity(code: string): number {
  // Simple cyclomatic complexity calculation
  const complexityKeywords = [
    'if', 'else', 'elif', 'while', 'for', 'switch', 'case', 
    'catch', 'try', 'throw', '&&', '||', '?', ':'
  ]
  
  let complexity = 1 // Base complexity
  
  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g')
    const matches = code.match(regex)
    complexity += matches ? matches.length : 0
  }
  
  return complexity
}
