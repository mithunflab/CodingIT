import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const billingUpdateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyEmail: z.string().email('Valid email is required'),
  taxId: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  paymentMethod: z.enum(['card', 'bank_transfer', 'invoice']),
  billingCycle: z.enum(['monthly', 'annual']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = billingUpdateSchema.parse(body)

    // Get user's team
    const { data: userTeam, error: teamError } = await supabase
      .from('users_teams')
      .select('team_id, teams(*)')
      .eq('user_id', user.id)
      .single()

    if (teamError || !userTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Update billing information in the database
    const { error: updateError } = await supabase
      .from('billing_info')
      .upsert({
        team_id: userTeam.team_id,
        company_name: validatedData.companyName,
        company_email: validatedData.companyEmail,
        tax_id: validatedData.taxId,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        postal_code: validatedData.postalCode,
        country: validatedData.country,
        payment_method: validatedData.paymentMethod,
        billing_cycle: validatedData.billingCycle,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'team_id'
      })

    if (updateError) {
      console.error('Error updating billing info:', updateError)
      return NextResponse.json({ error: 'Failed to update billing information' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Billing information updated successfully' })
  } catch (error) {
    console.error('Billing update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userTeam, error: teamError } = await supabase
      .from('users_teams')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (teamError || !userTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get billing information
    const { data: billingInfo, error: billingError } = await supabase
      .from('billing_info')
      .select('*')
      .eq('team_id', userTeam.team_id)
      .single()

    if (billingError && billingError.code !== 'PGRST116') {
      console.error('Error fetching billing info:', billingError)
      return NextResponse.json({ error: 'Failed to fetch billing information' }, { status: 500 })
    }

    return NextResponse.json({ 
      billingInfo: billingInfo || null 
    })
  } catch (error) {
    console.error('Billing fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}