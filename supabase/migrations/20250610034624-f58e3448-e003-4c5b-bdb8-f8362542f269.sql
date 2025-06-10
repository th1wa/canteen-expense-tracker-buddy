
-- Update the default role for profiles to be 'user' instead of 'canteen'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Add RLS policies to existing tables to restrict basic users to their own data
CREATE POLICY "Basic users can only view their own expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'canteen', 'hr') OR user_name = expenses.user_name)
    )
  );

CREATE POLICY "Basic users can only view their own payments" 
  ON public.payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'canteen', 'hr') OR user_name = payments.user_name)
    )
  );

-- Create function to generate user expense summary for admin/hr
CREATE OR REPLACE FUNCTION public.get_user_expense_summary(
  selected_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  user_name TEXT,
  expense_date DATE,
  expense_amount NUMERIC,
  payment_made BOOLEAN,
  payment_date DATE,
  remainder_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin or hr role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'hr')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or HR role required.';
  END IF;
  
  RETURN QUERY
  WITH monthly_expenses AS (
    SELECT 
      e.user_name,
      e.expense_date,
      COALESCE(SUM(e.amount), 0) as total_expense
    FROM public.expenses e
    WHERE DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', selected_month)
    GROUP BY e.user_name, e.expense_date
  ),
  monthly_payments AS (
    SELECT 
      p.user_name,
      p.payment_date,
      COALESCE(SUM(p.amount), 0) as total_payment
    FROM public.payments p
    WHERE DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', selected_month)
    GROUP BY p.user_name, p.payment_date
  )
  SELECT 
    COALESCE(e.user_name, p.user_name) as user_name,
    COALESCE(e.expense_date, p.payment_date) as expense_date,
    COALESCE(e.total_expense, 0) as expense_amount,
    CASE WHEN p.total_payment > 0 THEN TRUE ELSE FALSE END as payment_made,
    p.payment_date,
    COALESCE(e.total_expense, 0) - COALESCE(p.total_payment, 0) as remainder_amount
  FROM monthly_expenses e
  FULL OUTER JOIN monthly_payments p ON e.user_name = p.user_name AND e.expense_date = p.payment_date
  ORDER BY user_name, expense_date;
END;
$$;
