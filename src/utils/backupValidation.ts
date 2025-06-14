
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
  try {
    if (!backupData || typeof backupData !== 'object') {
      console.error('Backup validation failed: Invalid backup data type');
      return false;
    }

    if (!backupData.metadata || typeof backupData.metadata !== 'object') {
      console.error('Backup validation failed: Missing or invalid metadata');
      return false;
    }

    if (!backupData.metadata.timestamp || typeof backupData.metadata.timestamp !== 'string') {
      console.error('Backup validation failed: Missing or invalid timestamp');
      return false;
    }

    if (!backupData.metadata.version || typeof backupData.metadata.version !== 'string') {
      console.error('Backup validation failed: Missing or invalid version');
      return false;
    }

    if (!backupData.data || typeof backupData.data !== 'object') {
      console.error('Backup validation failed: Missing or invalid data object');
      return false;
    }

    // Validate timestamp format
    const timestamp = new Date(backupData.metadata.timestamp);
    if (isNaN(timestamp.getTime())) {
      console.error('Backup validation failed: Invalid timestamp format');
      return false;
    }

    // Check that at least one table has data
    const tables = ['expenses', 'payments', 'profiles', 'users'];
    const hasData = tables.some(table => 
      Array.isArray(backupData.data[table]) && backupData.data[table].length > 0
    );

    if (!hasData) {
      console.warn('Backup validation warning: No data found in any table');
    }

    return true;
  } catch (error) {
    console.error('Backup validation failed with error:', error);
    return false;
  }
};

export const sanitizeBackupData = (backupData: BackupData): BackupData => {
  try {
    return {
      metadata: {
        timestamp: String(backupData.metadata.timestamp || new Date().toISOString()),
        version: String(backupData.metadata.version || '1.0'),
        backup_type: String(backupData.metadata.backup_type || 'manual')
      },
      data: {
        expenses: Array.isArray(backupData.data.expenses) ? backupData.data.expenses.filter(item => item && typeof item === 'object') : [],
        payments: Array.isArray(backupData.data.payments) ? backupData.data.payments.filter(item => item && typeof item === 'object') : [],
        profiles: Array.isArray(backupData.data.profiles) ? backupData.data.profiles.filter(item => item && typeof item === 'object') : [],
        users: Array.isArray(backupData.data.users) ? backupData.data.users.filter(item => item && typeof item === 'object') : []
      }
    };
  } catch (error) {
    console.error('Error sanitizing backup data:', error);
    throw new Error('Failed to sanitize backup data: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const validateBackupFileSize = (backupData: any): boolean => {
  try {
    const jsonString = JSON.stringify(backupData);
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
    
    // Warn if backup is larger than 10MB
    if (sizeInMB > 10) {
      console.warn(`Large backup file detected: ${sizeInMB.toFixed(2)}MB`);
    }
    
    // Reject if larger than 50MB
    if (sizeInMB > 50) {
      console.error(`Backup file too large: ${sizeInMB.toFixed(2)}MB (max 50MB)`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating backup file size:', error);
    return false;
  }
};

export const validateBackupIntegrity = (backupData: BackupData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Check data consistency
    if (backupData.data.expenses) {
      backupData.data.expenses.forEach((expense, index) => {
        if (!expense.user_name || expense.amount == null) {
          errors.push(`Invalid expense at index ${index}: missing user_name or amount`);
        }
        if (expense.amount < 0) {
          errors.push(`Invalid expense at index ${index}: negative amount`);
        }
      });
    }
    
    if (backupData.data.payments) {
      backupData.data.payments.forEach((payment, index) => {
        if (!payment.user_name || payment.amount == null) {
          errors.push(`Invalid payment at index ${index}: missing user_name or amount`);
        }
        if (payment.amount < 0) {
          errors.push(`Invalid payment at index ${index}: negative amount`);
        }
      });
    }
    
    if (backupData.data.users) {
      backupData.data.users.forEach((user, index) => {
        if (!user.user_name) {
          errors.push(`Invalid user at index ${index}: missing user_name`);
        }
      });
    }
    
    if (backupData.data.profiles) {
      backupData.data.profiles.forEach((profile, index) => {
        if (!profile.id || !profile.username) {
          errors.push(`Invalid profile at index ${index}: missing id or username`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      errors
    };
  }
};
