import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-backup-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== Backup Function Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey
    });
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('Supabase client created');

    // Get backup type from headers
    const backupType = req.headers.get('x-backup-type') || 'manual_test';
    console.log('Backup type:', backupType);

    console.log('Starting backup process...');

    // Create backup data structure
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        backup_type: backupType
      },
      data: {} as any
    }

    // Export expenses
    console.log('Exporting expenses...');
    try {
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) {
        console.error('Expenses export error:', expensesError);
        throw new Error(`Failed to export expenses: ${expensesError.message}`);
      }
      
      backupData.data.expenses = expenses || [];
      console.log(`Exported ${expenses?.length || 0} expenses`);
    } catch (error) {
      console.error('Critical error exporting expenses:', error);
      throw error;
    }

    // Export payments
    console.log('Exporting payments...');
    try {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Payments export error:', paymentsError);
        throw new Error(`Failed to export payments: ${paymentsError.message}`);
      }
      
      backupData.data.payments = payments || [];
      console.log(`Exported ${payments?.length || 0} payments`);
    } catch (error) {
      console.error('Critical error exporting payments:', error);
      throw error;
    }

    // Export profiles
    console.log('Exporting profiles...');
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles export error:', profilesError);
        throw new Error(`Failed to export profiles: ${profilesError.message}`);
      }
      
      backupData.data.profiles = profiles || [];
      console.log(`Exported ${profiles?.length || 0} profiles`);
    } catch (error) {
      console.error('Critical error exporting profiles:', error);
      throw error;
    }

    // Export optional tables (non-critical)
    console.log('Exporting optional tables...');
    
    // Users table
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.log('Users table not accessible or does not exist');
      }
      backupData.data.users = users || [];
      console.log(`Exported ${users?.length || 0} users`);
    } catch (error) {
      console.log('Users table export skipped (non-critical)');
      backupData.data.users = [];
    }

    // User activity table
    try {
      const { data: userActivity, error: userActivityError } = await supabase
        .from('user_activity')
        .select('*')
        .order('timestamp', { ascending: false });

      if (userActivityError) {
        console.log('User activity table not accessible or does not exist');
      }
      backupData.data.user_activity = userActivity || [];
      console.log(`Exported ${userActivity?.length || 0} user activity records`);
    } catch (error) {
      console.log('User activity export skipped (non-critical)');
      backupData.data.user_activity = [];
    }

    // Activity logs table
    try {
      const { data: activityLogs, error: activityLogsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (activityLogsError) {
        console.log('Activity logs table not accessible or does not exist');
      }
      backupData.data.activity_logs = activityLogs || [];
      console.log(`Exported ${activityLogs?.length || 0} activity logs`);
    } catch (error) {
      console.log('Activity logs export skipped (non-critical)');
      backupData.data.activity_logs = [];
    }

    // Generate filename and content
    const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const backupContent = JSON.stringify(backupData, null, 2);
    
    console.log('Generated backup file:', fileName);
    console.log('Backup content size:', backupContent.length, 'characters');

    // Upload to storage
    console.log('Uploading to storage...');
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('automatic-backups')
        .upload(fileName, new Blob([backupContent], { type: 'application/json' }), {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload backup to storage: ${uploadError.message}`);
      }

      console.log('Backup uploaded successfully:', uploadData?.path);
    } catch (error) {
      console.error('Critical error uploading to storage:', error);
      throw error;
    }

    // Clean up old backups (keep only last 7 days)
    console.log('Cleaning up old backups...');
    try {
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('automatic-backups')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.warn('Warning: Could not list existing backups for cleanup:', listError);
      } else if (existingFiles && existingFiles.length > 7) {
        const filesToDelete = existingFiles.slice(7).map(file => file.name);
        
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
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
    
    // Calculate total records
    const totalRecords = Object.values(backupData.data).reduce((sum: number, arr: any) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);

    console.log('=== Backup Completed Successfully ===');
    console.log('Total records backed up:', totalRecords);
    
    const response = {
      success: true,
      message: 'Backup completed and uploaded to Supabase storage',
      filename: fileName,
      storage_path: `automatic-backups/${fileName}`,
      records: {
        expenses: backupData.data.expenses?.length || 0,
        payments: backupData.data.payments?.length || 0,
        profiles: backupData.data.profiles?.length || 0,
        users: backupData.data.users?.length || 0,
        user_activity: backupData.data.user_activity?.length || 0,
        activity_logs: backupData.data.activity_logs?.length || 0
      },
      totalRecords: totalRecords,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('=== Backup Function Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Unknown error occurred during backup',
      timestamp: new Date().toISOString(),
      details: 'Check edge function logs for more information',
      type: error?.constructor?.name || 'UnknownError'
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
