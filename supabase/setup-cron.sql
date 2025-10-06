-- Setup pg_cron for weekly summary regeneration
-- Run this in your Supabase SQL Editor after deploying the edge function

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making requests
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule weekly regeneration (every Sunday at 2 AM UTC)
-- Replace YOUR_PROJECT_URL with your actual Supabase project URL
-- Replace YOUR_ANON_KEY with your actual Supabase anon key
SELECT cron.schedule(
  'weekly-summary-regeneration',
  '0 2 * * 0', -- Every Sunday at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_URL.supabase.co/functions/v1/regenerate-summaries',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);

-- To view scheduled cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('weekly-summary-regeneration');
