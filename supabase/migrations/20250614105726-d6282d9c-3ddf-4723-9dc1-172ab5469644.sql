
-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule automatic daily backups at midnight UTC
SELECT cron.schedule(
  'daily-canteen-backup',
  '0 0 * * *', -- Daily at midnight (UTC)
  $$
  SELECT
    net.http_post(
        url:='https://wshugmfkkbpwpxfakqgk.supabase.co/functions/v1/auto-backup-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzaHVnbWZra2Jwd3B4ZmFrcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTExNTEsImV4cCI6MjA2NDc2NzE1MX0.uqoTSqp2LKlPgZbLMZKUlHYFcc9B9TeDmnDlx09wOnY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
