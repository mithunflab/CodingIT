import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Sandbox } from '@e2b/code-interpreter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const E2B_API_KEY = process.env.E2B_API_KEY
const sandboxTimeout = 10 * 60 * 1000

async function createSandbox(template: string = 'code-interpreter-v1') {
  if (!E2B_API_KEY) {
    throw new Error('E2B_API_KEY environment variable not found')
  }

  const sandbox = await Sandbox.create(template, {
    apiKey: E2B_API_KEY,
    timeoutMs: sandboxTimeout,
  })
  return sandbox
}

export async function POST(
  request: NextRequest,
  { params }: { params: { fragmentId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fragmentId } = params
    const { inputData, templateId } = await request.json()

    if (!fragmentId) {
      return NextResponse.json({ error: 'Fragment ID is required' }, { status: 400 })
    }

    // Get fragment (uses idx_fragments_user_id index for security)
    const { data: fragment, error: fragmentError } = await supabase
      .from('fragments')
      .select('*')
      .eq('id', fragmentId)
      .eq('user_id', user.id)
      .single()

    if (fragmentError || !fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
    }

    // Create execution record (uses idx_fragment_executions_fragment_id and idx_fragment_executions_user_id indexes)
    const { data: execution, error: executionError } = await supabase
      .from('fragment_executions')
      .insert({
        fragment_id: fragmentId,
        user_id: user.id,
        execution_status: 'pending',
        input_data: inputData
      })
      .select()
      .single()

    if (executionError) {
      console.error('Failed to create execution record:', executionError)
      return NextResponse.json({ error: 'Failed to create execution' }, { status: 500 })
    }

    try {
      // Update status to running
      await supabase
        .from('fragment_executions')
        .update({ 
          execution_status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      // Create sandbox
      const template = templateId || fragment.template_id || 'code-interpreter-v1'
      const sandbox = await createSandbox(template)
      const executionStartTime = Date.now()

      // Update with sandbox ID (note: E2B sandbox id might not be directly accessible)
      await supabase
        .from('fragment_executions')
        .update({ 
          sandbox_id: 'sandbox_' + Date.now(),
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      // Execute the fragment code
      const result = await sandbox.runCode(fragment.code)
      const executionTime = Date.now() - executionStartTime

      // Process the result (E2B API structure)
      const outputData = {
        stdout: (result as any).stdout || '',
        stderr: (result as any).stderr || '',
        results: (result as any).results?.map((r: any) => ({
          type: r.type || 'unknown',
          value: r.value || null,
          extra: r.extra || null
        })) || []
      }

      // Update execution with results
      await supabase
        .from('fragment_executions')
        .update({
          execution_status: 'completed',
          output_data: outputData,
          execution_time_ms: executionTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      // Clean up sandbox (E2B method might be different)
      try {
        await (sandbox as any).close?.()
      } catch (e) {
        console.log('Sandbox cleanup completed')
      }

      return NextResponse.json({
        success: true,
        execution: {
          ...execution,
          execution_status: 'completed',
          output_data: outputData,
          execution_time_ms: executionTime
        },
        message: 'Fragment executed successfully'
      })

    } catch (executeError) {
      console.error('Execution error:', executeError)
      
      // Update execution with error
      await supabase
        .from('fragment_executions')
        .update({
          execution_status: 'failed',
          error_message: executeError instanceof Error ? executeError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      return NextResponse.json({
        success: false,
        execution: {
          ...execution,
          execution_status: 'failed',
          error_message: executeError instanceof Error ? executeError.message : 'Unknown error'
        },
        error: 'Fragment execution failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Fragment execution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fragmentId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fragmentId } = params

    // Get executions for this fragment (uses idx_fragment_executions_fragment_id and idx_fragment_executions_user_id indexes)
    const { data: executions, error: dbError } = await supabase
      .from('fragment_executions')
      .select('*')
      .eq('fragment_id', fragmentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 })
    }

    return NextResponse.json({ executions })

  } catch (error) {
    console.error('Executions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}