
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { BackupData, ImportResults } from './types.ts';

export const importDatabase = async (backupData: BackupData, userId: string): Promise<ImportResults> => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const importResults: ImportResults = {
    expenses: 0,
    payments: 0,
    profiles: 0,
    errors: []
  };

  // Import expenses
  if (backupData.data.expenses && Array.isArray(backupData.data.expenses)) {
    try {
      // Clear existing data
      await supabaseClient.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert new data
      const { error: expensesError } = await supabaseClient
        .from('expenses')
        .insert(backupData.data.expenses);

      if (expensesError) throw expensesError;
      importResults.expenses = backupData.data.expenses.length;
    } catch (error) {
      importResults.errors.push(`Expenses import failed: ${error.message}`);
    }
  }

  // Import payments
  if (backupData.data.payments && Array.isArray(backupData.data.payments)) {
    try {
      // Clear existing data
      await supabaseClient.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert new data
      const { error: paymentsError } = await supabaseClient
        .from('payments')
        .insert(backupData.data.payments);

      if (paymentsError) throw paymentsError;
      importResults.payments = backupData.data.payments.length;
    } catch (error) {
      importResults.errors.push(`Payments import failed: ${error.message}`);
    }
  }

  // Import profiles (be careful not to remove the current admin)
  if (backupData.data.profiles && Array.isArray(backupData.data.profiles)) {
    try {
      // Don't delete current admin profile
      await supabaseClient
        .from('profiles')
        .delete()
        .neq('id', userId);
      
      // Filter out current admin from import to avoid conflicts
      const profilesToImport = backupData.data.profiles.filter(p => p.id !== userId);
      
      if (profilesToImport.length > 0) {
        const { error: profilesError } = await supabaseClient
          .from('profiles')
          .insert(profilesToImport);

        if (profilesError) throw profilesError;
      }
      importResults.profiles = profilesToImport.length;
    } catch (error) {
      importResults.errors.push(`Profiles import failed: ${error.message}`);
    }
  }

  return importResults;
};
