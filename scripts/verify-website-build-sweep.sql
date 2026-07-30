-- Read-only manual check for website build sweep / pg_cron setup.
-- Safe to run in Supabase SQL Editor anytime. No INSERT/UPDATE/DELETE.

-- 1) Required Postgres functions exist
SELECT
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fail_stale_pending_pages'
  ) AS has_fail_stale_pending_pages,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sweep_stuck_website_builds'
  ) AS has_sweep_stuck_website_builds,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'try_finalize_website_source'
  ) AS has_try_finalize_website_source;

-- 2) pg_cron job is active every 5 minutes
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'sweep-stuck-website-builds';

-- 3) Any builds still stuck in processing?
SELECT
  COUNT(*)::int AS processing_sources
FROM public.bot_website_sources
WHERE status = 'processing';

-- 4) Known production bot snapshot (change ids if testing another bot)
SELECT
  id,
  bot_id,
  status,
  completed_pages,
  failed_pages,
  refresh_error_message,
  updated_at
FROM public.bot_website_sources
WHERE id = '1cb711df-22dd-473f-918e-cd27e565253a';

SELECT
  page_url,
  status,
  error_message,
  updated_at
FROM public.bot_website_pages
WHERE source_id = '1cb711df-22dd-473f-918e-cd27e565253a'
ORDER BY status, page_url;

-- 5) Optional: recent cron runs for the sweep job (read-only)
SELECT
  jrd.jobid,
  j.jobname,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'sweep-stuck-website-builds'
ORDER BY jrd.start_time DESC
LIMIT 5;
