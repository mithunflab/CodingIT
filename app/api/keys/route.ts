import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function generateApiKey(): string {
  return `codinit_${nanoid(32)}`
}

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's API keys (uses idx_api_keys_user_id index)
    const { data: apiKeys, error: dbError } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })

  } catch (error) {
    console.error('API keys fetch error:', error)
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

    const { name, permissions, expiresInDays } = await request.json()

    if (!name || !permissions) {
      return NextResponse.json({ 
        error: 'Name and permissions are required' 
      }, { status: 400 })
    }

    // Generate API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPrefix = apiKey.substring(0, 12) + '...'

    // Calculate expiration date
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + expiresInDays)
      expiresAt = expiration.toISOString()
    }

    // Save to database (uses idx_api_keys_user_id index)
    const { data: apiKeyRecord, error: dbError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        expires_at: expiresAt,
        is_active: true
      })
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        expires_at,
        is_active,
        created_at
      `)
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      apiKey: apiKey, // Only return the full key once
      keyRecord: apiKeyRecord,
      message: 'API key created successfully. Please save it securely as it will not be shown again.'
    })

  } catch (error) {
    console.error('API key creation error:', error)
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

    const { keyId, action, name, permissions } = await request.json()

    if (!keyId || !action) {
      return NextResponse.json({ 
        error: 'Key ID and action are required' 
      }, { status: 400 })
    }

    let updateData: any = { updated_at: new Date().toISOString() }

    switch (action) {
      case 'activate':
        updateData.is_active = true
        break
      case 'deactivate':
        updateData.is_active = false
        break
      case 'update':
        if (name) updateData.name = name
        if (permissions) updateData.permissions = permissions
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update API key (uses idx_api_keys_user_id index for security)
    const { data: updatedKey, error: dbError } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', keyId)
      .eq('user_id', user.id)
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at
      `)
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      apiKey: updatedKey,
      message: 'API key updated successfully'
    })

  } catch (error) {
    console.error('API key update error:', error)
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

    const { keyId } = await request.json()

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    // Delete API key (uses idx_api_keys_user_id index for security)
    const { error: dbError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}