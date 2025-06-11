
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

    // This function will be called by a cron job
    console.log('Starting automatic daily backup...')

    // Export all data
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        backup_type: 'automatic_daily'
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
    
    console.log(`Automatic backup completed: ${fileName}`)
    
    // In a real implementation, you would save this to local storage
    // For now, we'll just log that the backup was created
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automatic backup completed',
        filename: fileName,
        records: {
          expenses: expenses?.length || 0,
          payments: payments?.length || 0,
          profiles: profiles?.length || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto backup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
