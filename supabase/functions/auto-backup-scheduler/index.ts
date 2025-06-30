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
    // Validate that this is being called by the cron job or system
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

    console.log('Starting automatic daily backup to Supabase storage...')

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

    // Export user_activity table with error handling
    try {
      const { data: userActivity, error: userActivityError } = await supabaseClient
        .from('user_activity')
        .select('*')
        .order('timestamp', { ascending: false })

      if (userActivityError) {
        console.error('User activity export error:', userActivityError);
        throw new Error(`Failed to export user activity: ${userActivityError.message}`);
      }
      backupData.data.user_activity = userActivity || [];
    } catch (error) {
      console.error('Critical error exporting user activity:', error);
      throw error;
    }

    const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}.json`
    const backupContent = JSON.stringify(backupData, null, 2);
    
    // Upload backup to Supabase storage
    try {
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('automatic-backups')
        .upload(fileName, new Blob([backupContent], { type: 'application/json' }), {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload backup to storage: ${uploadError.message}`);
      }

      console.log('Backup uploaded to storage successfully:', uploadData);
    } catch (error) {
      console.error('Critical error uploading to storage:', error);
      throw error;
    }

    // Clean up old backups (keep only last 7 days)
    try {
      const { data: existingFiles, error: listError } = await supabaseClient.storage
        .from('automatic-backups')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.warn('Warning: Could not list existing backups for cleanup:', listError);
      } else if (existingFiles && existingFiles.length > 7) {
        // Keep only the 7 most recent files
        const filesToDelete = existingFiles.slice(7).map(file => file.name);
        
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabaseClient.storage
            .from('automatic-backups')
            .remove(filesToDelete);

          if (deleteError) {
            console.warn('Warning: Could not delete old backup files:', deleteError);
          } else {
            console.log(`Cleaned up ${filesToDelete.length} old backup files`);
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Error during backup cleanup:', error);
    }
    
    // Validate backup data
    const totalRecords = Object.values(backupData.data).reduce((sum: number, arr: any) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    if (totalRecords === 0) {
      console.warn('Warning: Backup contains no data');
    }
    
    console.log(`Automatic backup completed and uploaded to storage: ${fileName}`)
    console.log(`Records backed up: ${JSON.stringify({
      expenses: backupData.data.expenses?.length || 0,
      payments: backupData.data.payments?.length || 0,
      profiles: backupData.data.profiles?.length || 0,
      users: backupData.data.users?.length || 0,
      user_activity: backupData.data.user_activity?.length || 0
    })}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automatic backup completed and uploaded to Supabase storage',
        filename: fileName,
        storage_path: `automatic-backups/${fileName}`,
        records: {
          expenses: backupData.data.expenses?.length || 0,
          payments: backupData.data.payments?.length || 0,
          profiles: backupData.data.profiles?.length || 0,
          users: backupData.data.users?.length || 0,
          user_activity: backupData.data.user_activity?.length || 0
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
