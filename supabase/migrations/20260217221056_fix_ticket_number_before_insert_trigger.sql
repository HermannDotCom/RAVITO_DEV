/*
  # Fix ticket_number race condition with BEFORE INSERT trigger

  ## Problem
  The ticket_number was generated in application code and passed as '' (empty string).
  Multiple concurrent inserts would collide on the unique constraint since '' is the same
  for every row before the after-insert update.

  ## Solution
  - Replace application-side generation with a BEFORE INSERT trigger
  - The trigger auto-generates the ticket_number using pg_advisory_xact_lock to prevent
    race conditions
  - Application code should now pass NULL or '' and the trigger will overwrite it

  ## Changes
  - Alter ticket_number column to allow NULL (for transition)
  - Create trigger function set_ticket_number_before_insert
  - Create BEFORE INSERT trigger on support_tickets
*/

ALTER TABLE support_tickets
  ALTER COLUMN ticket_number SET DEFAULT '';

CREATE OR REPLACE FUNCTION public.set_ticket_number_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('support_tickets_ticket_number'));

  SELECT COALESCE(
    MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)),
    0
  ) + 1
  INTO next_num
  FROM public.support_tickets
  WHERE ticket_number ~ '^TKT[0-9]+$';

  ticket_num := 'TKT' || LPAD(next_num::TEXT, 6, '0');
  NEW.ticket_number := ticket_num;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_ticket_number ON public.support_tickets;

CREATE TRIGGER trg_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number_before_insert();
