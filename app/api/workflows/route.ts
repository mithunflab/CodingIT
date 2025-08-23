import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { validateWorkflowDefinition } from '@/lib/workflow-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public') === 'true'

    let query = supabase.from('workflow_templates').select('*')

    if (isPublic) {
      // Get public workflow templates
      query = query.eq('is_public', true)
    } else {
      // Get user's workflow templates (uses idx_workflow_templates_created_by index)
      query = query.eq('created_by', user.id)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error: dbError } = await query.order('updated_at', { ascending: false })

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch workflow templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Workflow templates fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      description, 
      category, 
      workflowDefinition, 
      inputSchema, 
      outputSchema, 
      isPublic, 
      tags,
      version 
    } = await request.json()

    if (!name || !category || !workflowDefinition) {
      return NextResponse.json({ 
        error: 'Name, category, and workflow definition are required' 
      }, { status: 400 })
    }

    // Validate workflow definition
    if (!validateWorkflowDefinition(workflowDefinition)) {
      return NextResponse.json({ 
        error: 'Invalid workflow definition structure' 
      }, { status: 400 })
    }

    // Create workflow template (uses idx_workflow_templates_created_by index)
    const { data: template, error: dbError } = await supabase
      .from('workflow_templates')
      .insert({
        name,
        description: description || null,
        category,
        created_by: user.id,
        workflow_definition: workflowDefinition,
        input_schema: inputSchema || null,
        output_schema: outputSchema || null,
        is_public: isPublic || false,
        tags: tags || [],
        version: version || '1.0.0'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create workflow template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      template,
      message: 'Workflow template created successfully' 
    })

  } catch (error) {
    console.error('Workflow template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      templateId, 
      name, 
      description, 
      category, 
      workflowDefinition, 
      inputSchema, 
      outputSchema, 
      isPublic, 
      tags,
      version 
    } = await request.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (workflowDefinition !== undefined) {
      if (!validateWorkflowDefinition(workflowDefinition)) {
        return NextResponse.json({ 
          error: 'Invalid workflow definition structure' 
        }, { status: 400 })
      }
      updates.workflow_definition = workflowDefinition
    }
    if (inputSchema !== undefined) updates.input_schema = inputSchema
    if (outputSchema !== undefined) updates.output_schema = outputSchema
    if (isPublic !== undefined) updates.is_public = isPublic
    if (tags !== undefined) updates.tags = tags
    if (version !== undefined) updates.version = version

    // Update workflow template (uses idx_workflow_templates_created_by index for security)
    const { data: updatedTemplate, error: dbError } = await supabase
      .from('workflow_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('created_by', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Failed to update workflow template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      template: updatedTemplate,
      message: 'Workflow template updated successfully' 
    })

  } catch (error) {
    console.error('Workflow template update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // First delete all executions for this template (uses idx_workflow_executions_created_by index)
    await supabase
      .from('workflow_executions')
      .delete()
      .eq('template_id', templateId)
      .eq('created_by', user.id)

    // Then delete the workflow template (uses idx_workflow_templates_created_by index for security)
    const { error: dbError } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', templateId)
      .eq('created_by', user.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete workflow template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Workflow template deleted successfully' 
    })

  } catch (error) {
    console.error('Workflow template deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}