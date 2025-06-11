
export interface BackupMetadata {
  timestamp: string;
  version: string;
  exported_by?: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    expenses?: any[];
    payments?: any[];
    profiles?: any[];
  };
}

export interface ImportResults {
  expenses: number;
  payments: number;
  profiles: number;
  errors: string[];
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
  results?: ImportResults;
  error?: string;
}
