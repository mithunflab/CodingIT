import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL environment variable is not defined.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY environment variable is not defined.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
console.log('[api/projects/route.ts] Supabase client initialized (using service role key):', supabase ? 'OK' : 'Failed');

const createProjectSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  visibility: z.enum(['private', 'public']),
  template: z.string().optional(),
})


async function getUserFromAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  console.log('[api/projects/route.ts] getUserFromAuth - authHeader:', authHeader ? 'Present' : 'Missing');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[api/projects/route.ts] getUserFromAuth - No Bearer token found.');
    return null
  }

  const token = authHeader.substring(7)
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  console.log('[api/projects/route.ts] getUserFromAuth - supabase.auth.getUser result - user ID:', user?.id, 'error:', error);
  
  if (error || !user) {
    console.warn('[api/projects/route.ts] getUserFromAuth - Failed to get user from token or no user.', { error: error?.message });
    return null
  }

  console.log('[api/projects/route.ts] getUserFromAuth - User successfully retrieved:', user.id);
  return user
}

export async function GET(request: NextRequest) {
  console.log('[api/projects/route.ts] GET request received.');
  try {
    const user = await getUserFromAuth(request)
    if (!user) {
      console.warn('[api/projects/route.ts] GET - Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[api/projects/route.ts] GET - Authenticated user: ${user.id}. Fetching projects.`);
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[api/projects/route.ts] GET - Error fetching projects from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    console.log(`[api/projects/route.ts] GET - Successfully fetched ${projects?.length || 0} projects for user ${user.id}.`);
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[api/projects/route.ts] GET - Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('[api/projects/route.ts] POST request received.');
  try {
    const user = await getUserFromAuth(request)
    if (!user) {
      console.warn('[api/projects/route.ts] POST - Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[api/projects/route.ts] POST - Authenticated user: ${user.id}. Processing new project.`);
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        visibility: validatedData.visibility,
        template: validatedData.template,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[api/projects/route.ts] POST - Error creating project in Supabase:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    console.log(`[api/projects/route.ts] POST - Successfully created project ${project.id} for user ${user.id}.`);
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[api/projects/route.ts] POST - Invalid input:', error.errors);
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('[api/projects/route.ts] POST - Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
