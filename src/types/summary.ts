
export interface ExpenseSummary {
  user_name: string;
  expense_date: string;
  expense_amount: number;
  payment_made: boolean;
  payment_date: string | null;
  remainder_amount: number;
}

export interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
  daily_records: ExpenseSummary[];
}

export interface SummaryHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export interface UserSummaryTableProps {
  filteredData: UserSummary[];
  searchTerm: string;
  expandedUser: string | null;
  isExporting: boolean;
  onToggleExpand: (userName: string) => void;
  onExportUserDetail: (userName: string) => void;
}
