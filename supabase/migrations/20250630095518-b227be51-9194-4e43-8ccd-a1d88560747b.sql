
-- Fix storage bucket creation policies
-- First, ensure the automatic-backups bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'automatic-backups', 
  'automatic-backups', 
  false, 
  52428800, 
  ARRAY['application/json']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view automatic backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to manage automatic backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to insert automatic backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update automatic backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete automatic backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to view buckets" ON storage.buckets;

-- Create proper storage policies for the automatic-backups bucket
CREATE POLICY "Allow authenticated users to view automatic backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'automatic-backups' AND auth.role() = 'authenticated');

CREATE POLICY "Allow service role to manage automatic backups"
ON storage.objects FOR ALL
USING (bucket_id = 'automatic-backups' AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow authenticated users to insert automatic backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'automatic-backups' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update automatic backups"
ON storage.objects FOR UPDATE
USING (bucket_id = 'automatic-backups' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete automatic backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'automatic-backups' AND auth.role() = 'authenticated');

-- Allow bucket creation for authenticated users
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view buckets"
ON storage.buckets FOR SELECT
USING (auth.role() = 'authenticated');
