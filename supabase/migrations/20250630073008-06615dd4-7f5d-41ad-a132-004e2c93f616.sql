
-- Create a table to store user activity data (separate from the existing user_activity table)
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  session_duration INTERVAL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and HR can view all activity logs
CREATE POLICY "Admin and HR can view all activity logs" ON public.activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- Users can only view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() = user_id);

-- Only the system can insert activity logs
CREATE POLICY "System can insert activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (true);

-- Create an index for better performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_username ON public.activity_logs(username);
