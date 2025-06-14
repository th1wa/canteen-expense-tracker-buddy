
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { authenticateAdmin } from './auth.ts';
import { exportDatabase } from './export.ts';
import { importDatabase } from './import.ts';
import { ApiResponse } from './types.ts';

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
    // Authenticate user and get admin access
    const authResult = await authenticateAdmin(req.headers.get('Authorization'));
    
    if (!authResult) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' } as ApiResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user, supabaseClient } = authResult;

    // Read the request body once and parse it
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' } as ApiResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' } as ApiResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'export') {
      try {
        const backupData = await exportDatabase(user);
        
        // Validate export data
        if (!backupData || !backupData.data) {
          throw new Error('Export failed: No data returned');
        }

        const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}.json`;
        
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
        );
      } catch (error) {
        console.error('Export error:', error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Export failed' 
          } as ApiResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'import') {
      const { backupData } = requestBody;

      // Enhanced validation of backup data structure
      if (!backupData) {
        return new Response(
          JSON.stringify({ error: 'Missing backup data' } as ApiResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!backupData.data) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup data format: missing data object' } as ApiResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate metadata
      if (!backupData.metadata || !backupData.metadata.timestamp) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup data format: missing or invalid metadata' } as ApiResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate that data contains expected tables
      const expectedTables = ['expenses', 'payments', 'profiles', 'users'];
      const hasValidData = expectedTables.some(table => 
        Array.isArray(backupData.data[table]) && backupData.data[table].length > 0
      );

      if (!hasValidData) {
        console.warn('Warning: Backup contains no data for any expected tables');
      }

      try {
        const importResults = await importDatabase(backupData, user.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Import completed successfully',
            results: importResults
          } as ApiResponse),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Import error:', error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Import failed' 
          } as ApiResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Supported actions: export, import' } as ApiResponse),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Database backup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      } as ApiResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
