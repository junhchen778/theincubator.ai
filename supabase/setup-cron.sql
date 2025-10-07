-- ============================================================================
-- Setup pg_cron for Weekly AI Summary Regeneration
-- ============================================================================
-- 
-- This SQL sets up automatic weekly regeneration of AI summaries
-- using pg_cron to trigger a Supabase Edge Function.
--
-- BEFORE RUNNING:
-- 1. Deploy the Edge Function: supabase functions deploy regenerate-summaries
-- 2. Set Edge Function secrets (see WEEKLY_CRON_SETUP.md)
-- 3. Enable pg_cron extension in Supabase Dashboard > Database > Extensions
-- 4. Replace the placeholders below with your actual values
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================================================
-- IMPORTANT: Replace these placeholders before running!
-- ============================================================================

-- Schedule weekly regeneration (every Sunday at 2 AM UTC)
SELECT cron.schedule(
  'weekly-summary-regeneration',           -- Job name
  '0 2 * * 0',                             -- Cron schedule: Sunday at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/regenerate-summaries',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_CRON_SECRET'
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- Replace these values:
-- 
-- YOUR_PROJECT_REF   → xmvhinisflafruvzznqq
-- YOUR_CRON_SECRET   → The CRON_SECRET you set with: supabase secrets set CRON_SECRET=...
-- 
-- Example final URL:
-- https://xmvhinisflafruvzznqq.supabase.co/functions/v1/regenerate-summaries
-- ============================================================================

-- ============================================================================
-- Useful Commands
-- ============================================================================

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View cron job execution history:
-- SELECT 
--   jobid,
--   runid, 
--   job_name,
--   status,
--   start_time,
--   end_time,
--   return_message
-- FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 20;

-- Unschedule the job (if you want to remove it):
-- SELECT cron.unschedule('weekly-summary-regeneration');

-- Update the schedule (first unschedule, then reschedule):
-- SELECT cron.unschedule('weekly-summary-regeneration');
-- SELECT cron.schedule(...);

-- ============================================================================
-- Cron Schedule Patterns
-- ============================================================================
-- 
-- '0 2 * * 0'   - Every Sunday at 2 AM UTC (weekly)
-- '0 3 * * *'   - Every day at 3 AM UTC (daily)
-- '0 2 * * 1'   - Every Monday at 2 AM UTC (weekly on Monday)
-- '0 0 1 * *'   - First day of every month at midnight UTC (monthly)
-- '*/30 * * * *' - Every 30 minutes (for testing, not recommended for production!)
--
-- ============================================================================
