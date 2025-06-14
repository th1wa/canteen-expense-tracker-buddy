
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
