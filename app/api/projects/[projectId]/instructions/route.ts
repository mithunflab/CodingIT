import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const instructionsSchema = z.object({
  instructions: z.string().min(1).max(5000),
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

export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { projectId: string } };
  console.log(`[Project Instructions API] POST request for project ${params.projectId}`);
  
  try {
    const user = await getUserFromAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = instructionsSchema.parse(body);
    const { projectId } = params;

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('[Project Instructions API] Project not found or access denied:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project instructions
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        instructions: validatedData.instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('[Project Instructions API] Failed to update instructions:', updateError);
      return NextResponse.json({ error: 'Failed to save instructions' }, { status: 500 });
    }

    console.log(`[Project Instructions API] Successfully updated instructions for project ${projectId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('[Project Instructions API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { projectId: string } };
  console.log(`[Project Instructions API] GET request for project ${params.projectId}`);
  
  try {
    const user = await getUserFromAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('instructions')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      console.error('[Project Instructions API] Project not found:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      instructions: project.instructions || "" 
    });

  } catch (error) {
    console.error('[Project Instructions API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
