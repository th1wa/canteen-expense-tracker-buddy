
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
    const { user, supabaseClient } = await authenticateAdmin(req.headers.get('Authorization'));

    // Read the request body once and parse it
    const requestBody = await req.json();
    const { action } = requestBody;

    if (action === 'export') {
      const backupData = await exportDatabase(user);
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
    }

    if (action === 'import') {
      const { backupData } = requestBody;

      // Validate backup data structure
      if (!backupData || !backupData.data) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup data format' } as ApiResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const importResults = await importDatabase(backupData, user.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Import completed',
          results: importResults
        } as ApiResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' } as ApiResponse),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Database backup error:', error);
    return new Response(
      JSON.stringify({ error: error.message } as ApiResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
