import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const knowledgeEntrySchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  content_type: z.enum(['markdown', 'text', 'code', 'link']).default('text'),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  priority: z.number().int().min(0).max(10).default(0),
  file_path: z.string().max(500).optional(),
  source_url: z.string().max(1000).optional(),
  is_pinned: z.boolean().default(false)
});

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

// GET /api/projects/[projectId]/knowledge - Fetch all knowledge entries for a project
export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { projectId: string } };
  console.log(`[Project Knowledge API] GET request for project ${params.projectId}`);
  
  try {
    const user = await getUserFromAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const contentType = url.searchParams.get('content_type');

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build the query
    let query = supabase
      .from('project_knowledge')
      .select('*')
      .eq('project_id', projectId);

    // Add filters if provided
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    // Order by pinned first, then priority, then updated date
    query = query.order('is_pinned', { ascending: false })
                 .order('priority', { ascending: false })
                 .order('updated_at', { ascending: false });

    const { data: entries, error } = await query;

    if (error) {
      console.error('[Project Knowledge API] Failed to fetch knowledge entries:', error);
      return NextResponse.json({ error: 'Failed to fetch knowledge entries' }, { status: 500 });
    }

    return NextResponse.json({ entries: entries || [] });

  } catch (error) {
    console.error('[Project Knowledge API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/knowledge - Create a new knowledge entry
export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { projectId: string } };
  console.log(`[Project Knowledge API] POST request for project ${params.projectId}`);
  
  try {
    const user = await getUserFromAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const validatedData = knowledgeEntrySchema.parse(body);

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create the knowledge entry
    const { data: entry, error } = await supabase
      .from('project_knowledge')
      .insert({
        ...validatedData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      console.error('[Project Knowledge API] Failed to create knowledge entry:', error);
      return NextResponse.json({ error: 'Failed to create knowledge entry' }, { status: 500 });
    }

    console.log(`[Project Knowledge API] Successfully created knowledge entry ${entry.id}`);
    return NextResponse.json({ entry }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('[Project Knowledge API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
