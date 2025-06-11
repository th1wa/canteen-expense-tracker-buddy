
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set the auth context
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action } = await req.json()

    if (action === 'export') {
      // Export all data
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          exported_by: user.email
        },
        data: {}
      }

      // Export expenses
      const { data: expenses, error: expensesError } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (expensesError) throw expensesError
      backupData.data.expenses = expenses

      // Export payments
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError
      backupData.data.payments = payments

      // Export profiles
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError
      backupData.data.profiles = profiles

      const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}.json`
      
      return new Response(
        JSON.stringify(backupData, null, 2),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${fileName}"`
          }
        }
      )
    }

    if (action === 'import') {
      const { backupData } = await req.json()

      // Validate backup data structure
      if (!backupData || !backupData.data) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup data format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let importResults = {
        expenses: 0,
        payments: 0,
        profiles: 0,
        errors: []
      }

      // Import expenses
      if (backupData.data.expenses && Array.isArray(backupData.data.expenses)) {
        try {
          // Clear existing data
          await supabaseClient.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          
          // Insert new data
          const { error: expensesError } = await supabaseClient
            .from('expenses')
            .insert(backupData.data.expenses)

          if (expensesError) throw expensesError
          importResults.expenses = backupData.data.expenses.length
        } catch (error) {
          importResults.errors.push(`Expenses import failed: ${error.message}`)
        }
      }

      // Import payments
      if (backupData.data.payments && Array.isArray(backupData.data.payments)) {
        try {
          // Clear existing data
          await supabaseClient.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          
          // Insert new data
          const { error: paymentsError } = await supabaseClient
            .from('payments')
            .insert(backupData.data.payments)

          if (paymentsError) throw paymentsError
          importResults.payments = backupData.data.payments.length
        } catch (error) {
          importResults.errors.push(`Payments import failed: ${error.message}`)
        }
      }

      // Import profiles (be careful not to remove the current admin)
      if (backupData.data.profiles && Array.isArray(backupData.data.profiles)) {
        try {
          // Don't delete current admin profile
          await supabaseClient
            .from('profiles')
            .delete()
            .neq('id', user.id)
          
          // Filter out current admin from import to avoid conflicts
          const profilesToImport = backupData.data.profiles.filter(p => p.id !== user.id)
          
          if (profilesToImport.length > 0) {
            const { error: profilesError } = await supabaseClient
              .from('profiles')
              .insert(profilesToImport)

            if (profilesError) throw profilesError
          }
          importResults.profiles = profilesToImport.length
        } catch (error) {
          importResults.errors.push(`Profiles import failed: ${error.message}`)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Import completed',
          results: importResults
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Database backup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
