import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file)

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get file URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName)

    // Save file metadata to database using the idx_file_uploads_user_id and idx_file_uploads_project_id indexes
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        user_id: user.id,
        project_id: projectId,
        filename: file.name,
        file_path: storageData.path,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        upload_status: 'completed'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up storage if database insert fails
      await supabase.storage.from('project-files').remove([fileName])
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      file: fileRecord,
      message: 'File uploaded successfully' 
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', user.id) // Uses idx_file_uploads_user_id index
      .order('created_at', { ascending: false })

    // If projectId is provided, filter by it (uses idx_file_uploads_project_id index)
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: files, error: dbError } = await query

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ files })

  } catch (error) {
    console.error('File fetch error:', error)
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

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get file record (uses idx_file_uploads_user_id index)
    const { data: fileRecord, error: fetchError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}