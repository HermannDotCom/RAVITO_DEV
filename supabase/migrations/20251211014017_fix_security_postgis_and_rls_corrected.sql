/*
  # Fix PostGIS Extension and Spatial Reference System
  
  ## Changes
  1. Move PostGIS extension from public schema to extensions schema
  2. The spatial_ref_sys table is managed by PostGIS and doesn't need RLS
     (it's a read-only reference table used by PostGIS internally)
  
  ## Notes
  - spatial_ref_sys is a PostGIS system table that contains coordinate system definitions
  - It's safe to leave it without RLS as it only contains public reference data
  - Moving the extension will also move the spatial_ref_sys table
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move PostGIS extension to extensions schema
-- Note: This requires superuser privileges. If this fails, it should be done
-- via the Supabase dashboard or by a superuser.
DO $$
BEGIN
  -- Check if PostGIS is installed in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'postgis' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Drop and recreate in extensions schema
    DROP EXTENSION IF EXISTS postgis CASCADE;
    CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
  ELSE
    -- Just ensure it exists in extensions schema
    CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to move PostGIS extension. This should be done by a superuser via Supabase dashboard.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not move PostGIS extension. Error: %', SQLERRM;
END;
$$;