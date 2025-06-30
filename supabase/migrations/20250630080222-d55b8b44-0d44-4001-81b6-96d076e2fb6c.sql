
-- Add more detailed columns to user_activity table for better tracking
ALTER TABLE public.user_activity 
ADD COLUMN IF NOT EXISTS browser_name TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Add more detailed columns to activity_logs table
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS browser_name TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Add more user profile information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS join_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a table for backup management
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'completed',
  error_message TEXT
);

-- Enable RLS on backup_logs
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for backup_logs (only admins can access)
CREATE POLICY "Only admins can manage backup logs" ON public.backup_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
