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
    console.log('Backup request received:', req.method, req.url);
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Authorization check - Auth header exists:', !!authHeader);
    console.log('Service role key exists:', !!serviceRoleKey);
    
    // Allow calls from authenticated users or with proper service role key
    let isAuthorized = false;
    
    if (authHeader && authHeader.includes('Bearer')) {
      isAuthorized = true;
      console.log('Authorized via Bearer token');
    }
    
    if (!isAuthorized) {
      console.error('Unauthorized backup attempt - no valid authorization');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    console.log('Starting automatic backup...');

    // Export all data with proper error handling
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        backup_type: req.headers.get('x-backup-type') || 'manual_test'
      },
      data: {} as any
    }

    // Export expenses with error handling
    try {
      const { data: expenses, error: expensesError } = await supabaseClient
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

    // Export payments with error handling
    try {
      const { data: payments, error: paymentsError } = await supabaseClient
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

    // Export profiles with error handling
    try {
      const { data: profiles, error: profilesError } = await supabaseClient
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

    // Export users table with error handling
    try {
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users export error:', usersError);
        // Don't throw error for users table if it doesn't exist
        console.log('Users table may not exist or be accessible');
      }
      backupData.data.users = users || [];
      console.log(`Exported ${users?.length || 0} users`);
    } catch (error) {
      console.error('Error exporting users (non-critical):', error);
      backupData.data.users = [];
    }

    // Export user_activity table with error handling
    try {
      const { data: userActivity, error: userActivityError } = await supabaseClient
        .from('user_activity')
        .select('*')
        .order('timestamp', { ascending: false });

      if (userActivityError) {
        console.error('User activity export error:', userActivityError);
        // Don't throw error for optional table
        console.log('User activity table may not exist or be accessible');
      }
      backupData.data.user_activity = userActivity || [];
      console.log(`Exported ${userActivity?.length || 0} user activity records`);
    } catch (error) {
      console.error('Error exporting user activity (non-critical):', error);
      backupData.data.user_activity = [];
    }

    // Export activity_logs table with error handling
    try {
      const { data: activityLogs, error: activityLogsError } = await supabaseClient
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (activityLogsError) {
        console.error('Activity logs export error:', activityLogsError);
        // Don't throw error for optional table
        console.log('Activity logs table may not exist or be accessible');
      }
      backupData.data.activity_logs = activityLogs || [];
      console.log(`Exported ${activityLogs?.length || 0} activity logs`);
    } catch (error) {
      console.error('Error exporting activity logs (non-critical):', error);
      backupData.data.activity_logs = [];
    }

    const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const backupContent = JSON.stringify(backupData, null, 2);
    
    // First, ensure the bucket exists
    try {
      const { data: buckets, error: listBucketsError } = await supabaseClient.storage.listBuckets();
      
      if (listBucketsError) {
        console.error('Error listing buckets:', listBucketsError);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'automatic-backups');
      
      if (!bucketExists) {
        console.log('Creating automatic-backups bucket...');
        const { error: createBucketError } = await supabaseClient.storage.createBucket('automatic-backups', {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
        } else {
          console.log('Successfully created automatic-backups bucket');
        }
      }
    } catch (error) {
      console.error('Error managing storage bucket:', error);
      throw error;
    }
    
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
    
    console.log(`Backup completed and uploaded to storage: ${fileName}`);
    console.log(`Records backed up: ${JSON.stringify({
      expenses: backupData.data.expenses?.length || 0,
      payments: backupData.data.payments?.length || 0,
      profiles: backupData.data.profiles?.length || 0,
      users: backupData.data.users?.length || 0,
      user_activity: backupData.data.user_activity?.length || 0,
      activity_logs: backupData.data.activity_logs?.length || 0
    })}`);
    
    return new Response(
      JSON.stringify({
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
        totalRecords: totalRecords
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto backup error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred during backup',
        timestamp: new Date().toISOString(),
        details: 'Check edge function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
