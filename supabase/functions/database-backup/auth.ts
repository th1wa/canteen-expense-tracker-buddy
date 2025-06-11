
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const authenticateAdmin = async (authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Set the auth context
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('Invalid token');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return { user, supabaseClient };
};
