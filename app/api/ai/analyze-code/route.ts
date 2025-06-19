import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface CodeAnalysisRequest {
  code: string
  language: string
  file: string
  cursorPosition: { line: number; column: number }
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
    const { code, language, file, cursorPosition } = body

    if (!code || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Analyze code using AI
    const analysis = await analyzeCodeWithAI(code, language, file, cursorPosition)

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
  cursorPosition: { line: number; column: number }
): Promise<{
  suggestions: CodeSuggestion[]
  diagnostics: Diagnostic[]
  metrics: any
}> {
  // Get OpenAI API key from environment
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const lines = code.split('\n')
  const currentLine = lines[cursorPosition.line - 1] || ''
  const context = lines.slice(Math.max(0, cursorPosition.line - 5), cursorPosition.line + 5).join('\n')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert code analyst and assistant. Analyze the provided ${language} code and provide:

1. **Code Suggestions**: Improvements, optimizations, refactoring opportunities
2. **Diagnostics**: Potential errors, warnings, and issues
3. **Best Practices**: Adherence to ${language} conventions and patterns

Focus on:
- Performance optimizations
- Code quality improvements
- Security vulnerabilities
- Best practice violations
- Type safety (for TypeScript)
- Modern syntax usage
- Error handling improvements

Return your analysis as JSON in this exact format:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "completion|refactor|fix|optimize",
      "line": number,
      "column": number,
      "text": "original text",
      "replacement": "suggested replacement",
      "confidence": 0.0-1.0,
      "description": "brief description"
    }
  ],
  "diagnostics": [
    {
      "id": "unique-id",
      "type": "error|warning|info",
      "line": number,
      "column": number,
      "message": "diagnostic message",
      "suggestion": "optional fix suggestion"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Analyze this ${language} code from file "${file}":

\`\`\`${language}
${code}
\`\`\`

Current cursor position: Line ${cursorPosition.line}, Column ${cursorPosition.column}
Current line context: "${currentLine}"

Provide analysis focusing on the area around the cursor and overall code quality.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    const analysisText = result.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
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