
export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

export interface UserTotal {
  user_name: string;
  first_name?: string | null;
  last_name?: string | null;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  payment_progress: number;
  is_settled: boolean;
  payments: Payment[];
}
