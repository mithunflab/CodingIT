import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params
    const { name, inputData } = await request.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get workflow template (uses idx_workflow_templates_created_by index or public check)
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    // Create workflow execution (uses idx_workflow_executions_created_by index)
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        template_id: templateId,
        name: name || `Execution of ${template.name}`,
        created_by: user.id,
        execution_status: 'pending',
        input_data: inputData,
        execution_steps: []
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
        .from('workflow_executions')
        .update({ 
          execution_status: 'running',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      const executionStartTime = Date.now()
      
      // Execute the workflow (simplified simulation)
      const result = await executeWorkflow(template.workflow_definition, inputData)
      const executionTime = Date.now() - executionStartTime

      // Update execution with results
      await supabase
        .from('workflow_executions')
        .update({
          execution_status: 'completed',
          output_data: result.output,
          execution_steps: result.steps,
          completed_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      return NextResponse.json({
        success: true,
        execution: {
          ...execution,
          execution_status: 'completed',
          output_data: result.output,
          execution_steps: result.steps,
          execution_time_ms: executionTime
        },
        message: 'Workflow executed successfully'
      })

    } catch (executeError) {
      console.error('Execution error:', executeError)
      
      // Update execution with error
      await supabase
        .from('workflow_executions')
        .update({
          execution_status: 'failed',
          error_message: executeError instanceof Error ? executeError.message : 'Unknown error',
          completed_at: new Date().toISOString(),
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
        error: 'Workflow execution failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get executions for this template (uses idx_workflow_executions_created_by index)
    const { data: executions, error: dbError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('template_id', templateId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

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

// Simplified workflow execution engine
async function executeWorkflow(
  workflowDefinition: Record<string, any>, 
  inputData?: Record<string, any>
): Promise<{ output: any; steps: Array<any> }> {
  const steps: Array<any> = []
  let currentData = inputData || {}

  for (const step of workflowDefinition.steps) {
    const stepStart = Date.now()
    
    try {
      let stepResult
      
      // Simulate different step types
      switch (step.type) {
        case 'data-transform':
          stepResult = await simulateDataTransform(step, currentData)
          break
        case 'api-call':
          stepResult = await simulateApiCall(step, currentData)
          break
        case 'condition':
          stepResult = await simulateCondition(step, currentData)
          break
        case 'loop':
          stepResult = await simulateLoop(step, currentData)
          break
        default:
          stepResult = { result: 'Step completed', data: currentData }
      }

      steps.push({
        step_name: step.name,
        status: 'completed',
        result: stepResult.result,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - stepStart
      })

      currentData = { ...currentData, ...stepResult.data }

    } catch (error) {
      steps.push({
        step_name: step.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - stepStart
      })
      throw error
    }
  }

  return {
    output: currentData,
    steps
  }
}

async function simulateDataTransform(step: any, data: any) {
  // Simulate data transformation
  await new Promise(resolve => setTimeout(resolve, 100))
  return {
    result: `Data transformed using ${step.config?.transformation || 'default'} transformation`,
    data: { ...data, transformed: true }
  }
}

async function simulateApiCall(step: any, data: any) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 200))
  return {
    result: `API call to ${step.config?.url || 'example.com'} completed`,
    data: { ...data, api_response: { status: 'success', data: 'mock_data' } }
  }
}

async function simulateCondition(step: any, data: any) {
  // Simulate condition evaluation
  await new Promise(resolve => setTimeout(resolve, 50))
  const condition = step.config?.condition || 'true'
  return {
    result: `Condition '${condition}' evaluated`,
    data: { ...data, condition_result: true }
  }
}

async function simulateLoop(step: any, data: any) {
  // Simulate loop execution
  await new Promise(resolve => setTimeout(resolve, 150))
  const iterations = step.config?.iterations || 3
  return {
    result: `Loop executed ${iterations} times`,
    data: { ...data, loop_completed: true, iterations }
  }
}