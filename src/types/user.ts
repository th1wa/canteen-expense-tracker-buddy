
export interface UserTotal {
  user_name: string;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  payment_progress: number;
  is_settled: boolean;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    created_at: string;
  }>;
}
