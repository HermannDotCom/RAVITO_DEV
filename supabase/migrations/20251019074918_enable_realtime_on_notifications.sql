/*
  # Enable Realtime on notifications table
  
  1. Changes
    - Enable realtime replication on the notifications table
    - This allows clients to receive instant notifications when created
    
  2. Purpose
    - Users receive instant notifications when:
      - Their account is approved or rejected by admin
      - Their zone request is approved or rejected by admin
    - No polling needed, updates are pushed in real-time
*/

-- Enable realtime for the notifications table
alter publication supabase_realtime add table notifications;