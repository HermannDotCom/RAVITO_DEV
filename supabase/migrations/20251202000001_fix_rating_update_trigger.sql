/*
  # Fix Rating Update Trigger
  
  1. Changes
    - Recreate the update_user_rating() function with ROUND for 2 decimal precision
    - Ensure trigger is properly enabled on ratings table
    
  2. Purpose
    - Automatically update user's average rating when they receive a new rating
    - Fix issue where ratings were not being reflected in user profiles
*/

-- Recreate the function with improved precision
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT COALESCE(ROUND(AVG(overall)::numeric, 2), 5.0)
    FROM ratings
    WHERE to_user_id = NEW.to_user_id
  )
  WHERE id = NEW.to_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists and is enabled
DROP TRIGGER IF EXISTS update_user_rating_on_new_rating ON ratings;
CREATE TRIGGER update_user_rating_on_new_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Add comment for documentation
COMMENT ON FUNCTION update_user_rating() IS 'Automatically updates user average rating when a new rating is inserted';
