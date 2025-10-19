/*
  # Enable Realtime on profiles table
  
  1. Changes
    - Enable realtime replication on the profiles table
    - This allows clients to receive instant updates when profile data changes
    
  2. Purpose
    - When an admin approves or rejects a user, the user's session will be updated instantly
    - Users in pending approval status will automatically see their access rights updated
    - No need to log out and log back in after approval
*/

-- Enable realtime for the profiles table
alter publication supabase_realtime add table profiles;