import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function getUserFromAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { projectId: string } };
  const requestId = `github_import_${crypto.randomUUID()}`;
  console.log(`[GitHub Import Project API ${requestId}] POST request for project ${params.projectId}`);
  
  try {
    const user = await getUserFromAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('[GitHub Import Project API] Project not found or access denied:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const githubRepo = formData.get('github_repo') as string;
    const analysisData = formData.get('analysis') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!githubRepo) {
      return NextResponse.json({ error: 'GitHub repository information required' }, { status: 400 });
    }

    let analysis: any = null;
    if (analysisData) {
      try {
        analysis = JSON.parse(analysisData);
      } catch (error) {
        console.warn('[GitHub Import Project API] Failed to parse analysis data:', error);
      }
    }

    console.log(`[GitHub Import Project API ${requestId}] Processing ${files.length} files from ${githubRepo}`);

    // Create knowledge entries for each file
    const knowledgeEntries = [];

    for (const file of files) {
    try {
      const content = await file.text();
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Determine content type based on file extension
      let contentType: 'markdown' | 'text' | 'code' | 'link' = 'text';
      if (fileExtension === 'md') {
        contentType = 'markdown';
      } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb'].includes(fileExtension)) {
        contentType = 'code';
      }

    let category = 'Resources';
    const fileName = file.name.toLowerCase();
    const filePath = file.name;
    
    // Documentation files
    if (fileName.includes('readme') || fileName.includes('doc') || fileName.includes('guide') || 
        fileName.endsWith('.md') || filePath.includes('/docs/') || filePath.includes('/documentation/')) {
      category = 'Documentation';
    }
    // Configuration and setup files
    else if (fileName.includes('config') || fileName.includes('.env') || fileName.includes('package.json') ||
           fileName.includes('dockerfile') || fileName.includes('docker-compose') || 
           fileName.includes('makefile') || fileName.includes('.yml') || fileName.includes('.yaml') ||
           filePath.includes('/config/') || filePath.includes('/.github/')) {
      category = 'Setup';
    }
    // Test files
    else if (fileName.includes('test') || fileName.includes('spec') || filePath.includes('/test/') || 
           filePath.includes('/tests/') || filePath.includes('/__tests__/')) {
      category = 'Testing';
    }
    // Source code files
    else if (contentType === 'code') {
      if (filePath.includes('/src/') || filePath.includes('/lib/') || filePath.includes('/app/')) {
        category = 'Code Examples';
      } else if (filePath.includes('/components/') || filePath.includes('/ui/')) {
        category = 'UI Components';
      } else if (filePath.includes('/api/') || filePath.includes('/routes/') || filePath.includes('/controllers/')) {
        category = 'API';
      } else {
        category = 'Code Examples';
      }
    }

      const tags = ['github', 'imported'];
      if (analysis?.structure?.frameworks) {
        tags.push(...Array.from(analysis.structure.frameworks).slice(0, 3).map(String));
      }
      if (analysis?.structure?.architecture?.type) {
        tags.push(String(analysis.structure.architecture.type));
      }
      tags.push(fileExtension);

      const knowledgeEntry = {
        title: file.name,
        content: content,
        content_type: contentType,
        category: category,
        tags: tags.filter(tag => tag && tag.length > 0),
        priority: file.name.toLowerCase().includes('readme') ? 10 : 5,
        file_path: file.name,
        source_url: `https://github.com/${githubRepo}/blob/main/${file.name}`,
        is_pinned: file.name.toLowerCase().includes('readme'),
        project_id: projectId
      };

      knowledgeEntries.push(knowledgeEntry);
    } catch (error) {
      console.error(`[GitHub Import Project API ${requestId}] Failed to process file ${file.name}:`, error);
      continue;
    }
    }

    if (knowledgeEntries.length === 0) {
      return NextResponse.json({ error: 'No valid files could be processed' }, { status: 400 });
    }

    // Insert knowledge entries into database
    const { data: insertedEntries, error: insertError } = await supabase
      .from('project_knowledge')
      .insert(knowledgeEntries)
      .select();

    if (insertError) {
      console.error('[GitHub Import Project API] Failed to insert knowledge entries:', insertError);
      return NextResponse.json({ error: 'Failed to save project knowledge' }, { status: 500 });
    }

    // Update project metadata with GitHub information
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        github_repo: githubRepo,
        template: analysis?.structure?.architecture?.type || 'github-import',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.warn('[GitHub Import Project API] Failed to update project metadata:', updateError);
      // Don't fail the request for this
    }

    console.log(`[GitHub Import Project API ${requestId}] Successfully imported ${knowledgeEntries.length} files from ${githubRepo}`);

    return NextResponse.json({ 
      success: true,
      imported_files: knowledgeEntries.length,
      github_repo: githubRepo,
      knowledge_entries: insertedEntries
    });

  } catch (error) {
    console.error(`[GitHub Import Project API ${requestId}] Unexpected error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
