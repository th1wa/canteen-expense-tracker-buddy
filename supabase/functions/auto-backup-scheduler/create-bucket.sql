
-- Create the automatic-backups storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'automatic-backups', 
  'automatic-backups', 
  false, 
  52428800, 
  ARRAY['application/json']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the automatic-backups bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view automatic backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'automatic-backups' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow service role to manage automatic backups"
ON storage.objects FOR ALL
USING (bucket_id = 'automatic-backups' AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow system to insert automatic backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'automatic-backups');
