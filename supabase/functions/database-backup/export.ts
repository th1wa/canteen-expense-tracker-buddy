
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { BackupData } from './types.ts';

export const exportDatabase = async (user: any): Promise<BackupData> => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const backupData: BackupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      exported_by: user.email
    },
    data: {}
  };

  // Export expenses
  const { data: expenses, error: expensesError } = await supabaseClient
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (expensesError) throw expensesError;
  backupData.data.expenses = expenses;

  // Export payments
  const { data: payments, error: paymentsError } = await supabaseClient
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (paymentsError) throw paymentsError;
  backupData.data.payments = payments;

  // Export profiles
  const { data: profiles, error: profilesError } = await supabaseClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) throw profilesError;
  backupData.data.profiles = profiles;

  return backupData;
};
