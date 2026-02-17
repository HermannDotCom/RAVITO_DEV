/*
  # Schedule ticket follow-up cron job (v2 - direct SQL call)

  ## Overview
  Schedules a cron job that calls process_ticket_auto_close() directly in SQL,
  without needing an HTTP call to the edge function.
  Runs every hour. The function handles:
  - Sending follow-up reminders every 2 days for resolved tickets
  - Auto-closing tickets after 3 reminders (6 days total)
*/

SELECT cron.unschedule('ticket-followup-job')
FROM cron.job
WHERE jobname = 'ticket-followup-job';

SELECT cron.schedule(
  'ticket-followup-job',
  '0 * * * *',
  $$ SELECT process_ticket_auto_close(); $$
);
