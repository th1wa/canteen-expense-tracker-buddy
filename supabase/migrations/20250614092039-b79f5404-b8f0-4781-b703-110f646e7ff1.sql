
-- Create a users table to store user information
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
CREATE POLICY "Everyone can view users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Admin and canteen can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'canteen')
    )
  );

CREATE POLICY "Admin and canteen can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'canteen')
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample users (you can modify these as needed)
INSERT INTO public.users (user_name, first_name, last_name) VALUES
  ('Kamal', 'Kamal', 'Silva'),
  ('Nimal', 'Nimal', 'Perera'),
  ('Sunil', 'Sunil', 'Fernando'),
  ('Chamara', 'Chamara', 'Rajapakse');
