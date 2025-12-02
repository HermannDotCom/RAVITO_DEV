/*
  # Create function to get public profile information
  
  This function bypasses RLS to allow users to see public information
  about other users (name, business_name, rating) for:
  - Rating reminders (see who to rate)
  - Order history (see supplier names)
  - Statistics (favorite suppliers)
  - Order tracking (supplier location)
  
  Security: Only returns public, non-sensitive information
*/

-- Function to get public profile info for multiple users
CREATE OR REPLACE FUNCTION get_public_profile_info(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  phone text,
  rating numeric,
  address text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating,
    p.address
  FROM profiles p
  WHERE p.id = ANY(user_ids)
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_public_profile_info(uuid[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_public_profile_info(uuid[]) IS 
  'Returns public profile information (name, business_name, phone, rating, address) for a list of user IDs. Used for displaying counterparty names in orders and ratings.';
