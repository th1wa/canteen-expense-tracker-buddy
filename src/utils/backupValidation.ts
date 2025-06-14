
export interface BackupData {
  metadata: {
    timestamp: string;
    version: string;
    backup_type: string;
  };
  data: {
    expenses?: any[];
    payments?: any[];
    profiles?: any[];
    users?: any[];
  };
}

export const validateBackupStructure = (backupData: any): backupData is BackupData => {
  if (!backupData || typeof backupData !== 'object') {
    return false;
  }

  if (!backupData.metadata || typeof backupData.metadata !== 'object') {
    return false;
  }

  if (!backupData.metadata.timestamp || !backupData.metadata.version) {
    return false;
  }

  if (!backupData.data || typeof backupData.data !== 'object') {
    return false;
  }

  // Check that at least one table has data
  const tables = ['expenses', 'payments', 'profiles', 'users'];
  const hasData = tables.some(table => 
    Array.isArray(backupData.data[table]) && backupData.data[table].length > 0
  );

  return hasData;
};

export const sanitizeBackupData = (backupData: BackupData): BackupData => {
  return {
    metadata: {
      timestamp: backupData.metadata.timestamp,
      version: backupData.metadata.version,
      backup_type: backupData.metadata.backup_type
    },
    data: {
      expenses: Array.isArray(backupData.data.expenses) ? backupData.data.expenses : [],
      payments: Array.isArray(backupData.data.payments) ? backupData.data.payments : [],
      profiles: Array.isArray(backupData.data.profiles) ? backupData.data.profiles : [],
      users: Array.isArray(backupData.data.users) ? backupData.data.users : []
    }
  };
};
