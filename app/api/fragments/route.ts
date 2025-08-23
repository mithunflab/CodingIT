import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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
    const projectId = searchParams.get('projectId')
    const language = searchParams.get('language')
    const isPublic = searchParams.get('public') === 'true'

    let query = supabase.from('fragments').select('*')

    if (isPublic) {
      // Get public fragments
      query = query.eq('is_public', true)
    } else {
      // Get user's fragments (uses idx_fragments_user_id index)
      query = query.eq('user_id', user.id)
    }

    if (projectId) {
      // Filter by project (uses idx_fragments_project_id index)
      query = query.eq('project_id', projectId)
    }

    if (language) {
      query = query.eq('language', language)
    }

    const { data: fragments, error: dbError } = await query.order('updated_at', { ascending: false })

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch fragments' }, { status: 500 })
    }

    return NextResponse.json({ fragments })

  } catch (error) {
    console.error('Fragments fetch error:', error)
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
      title, 
      description, 
      code, 
      language, 
      projectId, 
      templateId, 
      isPublic, 
      tags 
    } = await request.json()

    if (!title || !code || !language) {
      return NextResponse.json({ 
        error: 'Title, code, and language are required' 
      }, { status: 400 })
    }

    // Create fragment (uses idx_fragments_user_id and idx_fragments_project_id indexes)
    const { data: fragment, error: dbError } = await supabase
      .from('fragments')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        title,
        description: description || null,
        code,
        language,
        template_id: templateId || null,
        is_public: isPublic || false,
        tags: tags || [],
        metadata: {}
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create fragment' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      fragment,
      message: 'Fragment created successfully' 
    })

  } catch (error) {
    console.error('Fragment creation error:', error)
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
      fragmentId, 
      title, 
      description, 
      code, 
      language, 
      isPublic, 
      tags 
    } = await request.json()

    if (!fragmentId) {
      return NextResponse.json({ error: 'Fragment ID is required' }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (code !== undefined) updates.code = code
    if (language !== undefined) updates.language = language
    if (isPublic !== undefined) updates.is_public = isPublic
    if (tags !== undefined) updates.tags = tags

    // Update fragment (uses idx_fragments_user_id index for security)
    const { data: updatedFragment, error: dbError } = await supabase
      .from('fragments')
      .update(updates)
      .eq('id', fragmentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Failed to update fragment' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      fragment: updatedFragment,
      message: 'Fragment updated successfully' 
    })

  } catch (error) {
    console.error('Fragment update error:', error)
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

    const { fragmentId } = await request.json()

    if (!fragmentId) {
      return NextResponse.json({ error: 'Fragment ID is required' }, { status: 400 })
    }

    // First delete all executions for this fragment (uses idx_fragment_executions_fragment_id index)
    await supabase
      .from('fragment_executions')
      .delete()
      .eq('fragment_id', fragmentId)
      .eq('user_id', user.id)

    // Then delete the fragment (uses idx_fragments_user_id index for security)
    const { error: dbError } = await supabase
      .from('fragments')
      .delete()
      .eq('id', fragmentId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete fragment' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Fragment deleted successfully' 
    })

  } catch (error) {
    console.error('Fragment deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}