/*
  # Add ticket resolution tracking columns

  ## Overview
  Adds columns and a DB function to support the resolution workflow:
  - When admin sets status to 'resolved', track resolution time and schedule auto-close
  - Track how many follow-up reminders have been sent
  - Auto-close after 3 reminders (every 2 days = 6 days total after resolution)

  ## New Columns on support_tickets
  - `resolved_at` - already exists, used to track when ticket was resolved
  - `follow_up_count` (int, default 0) - number of follow-up reminders sent
  - `auto_close_at` (timestamptz, nullable) - scheduled auto-close timestamp (set when resolved)

  ## New Function
  - `process_ticket_auto_close()` - finds resolved tickets past their auto_close_at date and closes them,
    called by the edge function on schedule
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'follow_up_count'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN follow_up_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'auto_close_at'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN auto_close_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'last_follow_up_at'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN last_follow_up_at timestamptz;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION process_ticket_auto_close()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_admin_id uuid;
  v_closed_count integer := 0;
  v_reminder_count integer := 0;
BEGIN
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE role = 'admin'
  LIMIT 1;

  FOR v_ticket IN
    SELECT st.id, st.ticket_number, st.user_id, st.follow_up_count, st.resolved_at, st.auto_close_at
    FROM support_tickets st
    WHERE st.status = 'resolved'
      AND st.auto_close_at IS NOT NULL
  LOOP
    IF now() >= v_ticket.auto_close_at THEN
      UPDATE support_tickets
      SET status = 'closed',
          updated_at = now()
      WHERE id = v_ticket.id;

      IF v_admin_id IS NOT NULL THEN
        INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal)
        VALUES (
          v_ticket.id,
          v_admin_id,
          'Ce ticket a été fermé automatiquement après 6 jours sans réponse de votre part.',
          false
        );
      END IF;

      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        v_ticket.user_id,
        'ticket_status_changed',
        'Ticket fermé automatiquement',
        'Votre ticket #' || v_ticket.ticket_number || ' a été fermé automatiquement.',
        jsonb_build_object('ticket_id', v_ticket.id, 'ticket_number', v_ticket.ticket_number)
      );

      v_closed_count := v_closed_count + 1;

    ELSIF v_ticket.follow_up_count < 3
      AND (
        v_ticket.last_follow_up_at IS NULL
        OR now() >= v_ticket.last_follow_up_at + interval '2 days'
      )
    THEN
      DECLARE
        v_follow_up_num integer := v_ticket.follow_up_count + 1;
        v_remaining integer := 3 - v_ticket.follow_up_count;
        v_msg text;
      BEGIN
        IF v_follow_up_num = 1 THEN
          v_msg := 'Rappel : votre ticket #' || v_ticket.ticket_number || ' a été marqué comme résolu. Avez-vous pu vérifier que votre problème est bien résolu ? Vous pouvez fermer ce ticket ou le rouvrir si le problème persiste. Ce ticket sera fermé automatiquement dans ' || (v_remaining * 2) || ' jours.';
        ELSIF v_follow_up_num = 2 THEN
          v_msg := 'Rappel 2/3 : votre ticket #' || v_ticket.ticket_number || ' est toujours en attente de votre confirmation. Merci de fermer ce ticket si tout est réglé, ou de le rouvrir si le problème persiste. Fermeture automatique dans 2 jours.';
        ELSE
          v_msg := 'Dernier rappel : votre ticket #' || v_ticket.ticket_number || ' sera fermé automatiquement dans 2 jours si vous ne répondez pas. Cliquez sur "Fermer le ticket" si votre problème est résolu, ou "Rouvrir" si vous avez encore besoin d''aide.';
        END IF;

        IF v_admin_id IS NOT NULL THEN
          INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal)
          VALUES (v_ticket.id, v_admin_id, v_msg, false);
        END IF;

        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_ticket.user_id,
          'ticket_message',
          'Rappel : ticket en attente de confirmation',
          'Votre ticket #' || v_ticket.ticket_number || ' attend votre retour.',
          jsonb_build_object('ticket_id', v_ticket.id, 'ticket_number', v_ticket.ticket_number)
        );

        UPDATE support_tickets
        SET follow_up_count = v_follow_up_num,
            last_follow_up_at = now(),
            updated_at = now()
        WHERE id = v_ticket.id;

        v_reminder_count := v_reminder_count + 1;
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'closed', v_closed_count,
    'reminders_sent', v_reminder_count
  );
END;
$$;
