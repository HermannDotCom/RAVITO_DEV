/*
  # Schedule ticket follow-up cron job

  ## Overview
  Activates the pg_cron extension and schedules the ticket-followup edge function
  to run every hour via a cron job.

  ## Details
  - Enables pg_cron and pg_net extensions (required for HTTP calls from cron)
  - Creates a cron job that runs every hour
  - The job calls the ticket-followup edge function which:
    1. Sends follow-up reminders every 2 days to unconfirmed resolved tickets
    2. Auto-closes tickets after 3 reminders (6 days total)
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('ticket-followup-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'ticket-followup-job'
);

SELECT cron.schedule(
  'ticket-followup-job',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM pg_settings WHERE name = 'app.settings.supabase_url' LIMIT 1) || '/functions/v1/ticket-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM pg_settings WHERE name = 'app.settings.service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
