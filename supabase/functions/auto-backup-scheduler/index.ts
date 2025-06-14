
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
    // Validate that this is being called by the cron job
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader || !authHeader.includes(expectedToken || '')) {
      console.error('Unauthorized backup attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting automatic daily backup...')

    // Export all data with proper error handling
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        backup_type: 'automatic_daily'
      },
      data: {} as any
    }

    // Export expenses with error handling
    try {
      const { data: expenses, error: expensesError } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (expensesError) {
        console.error('Expenses export error:', expensesError);
        throw new Error(`Failed to export expenses: ${expensesError.message}`);
      }
      backupData.data.expenses = expenses || [];
    } catch (error) {
      console.error('Critical error exporting expenses:', error);
      throw error;
    }

    // Export payments with error handling
    try {
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('Payments export error:', paymentsError);
        throw new Error(`Failed to export payments: ${paymentsError.message}`);
      }
      backupData.data.payments = payments || [];
    } catch (error) {
      console.error('Critical error exporting payments:', error);
      throw error;
    }

    // Export profiles with error handling
    try {
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Profiles export error:', profilesError);
        throw new Error(`Failed to export profiles: ${profilesError.message}`);
      }
      backupData.data.profiles = profiles || [];
    } catch (error) {
      console.error('Critical error exporting profiles:', error);
      throw error;
    }

    // Export users table with error handling
    try {
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Users export error:', usersError);
        throw new Error(`Failed to export users: ${usersError.message}`);
      }
      backupData.data.users = users || [];
    } catch (error) {
      console.error('Critical error exporting users:', error);
      throw error;
    }

    const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}.json`
    
    // Validate backup data
    const totalRecords = Object.values(backupData.data).reduce((sum: number, arr: any) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    if (totalRecords === 0) {
      console.warn('Warning: Backup contains no data');
    }
    
    console.log(`Automatic backup completed: ${fileName}`)
    console.log(`Records backed up: ${JSON.stringify({
      expenses: backupData.data.expenses?.length || 0,
      payments: backupData.data.payments?.length || 0,
      profiles: backupData.data.profiles?.length || 0,
      users: backupData.data.users?.length || 0
    })}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automatic backup completed successfully',
        filename: fileName,
        records: {
          expenses: backupData.data.expenses?.length || 0,
          payments: backupData.data.payments?.length || 0,
          profiles: backupData.data.profiles?.length || 0,
          users: backupData.data.users?.length || 0
        },
        totalRecords: totalRecords
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto backup error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred during backup',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
