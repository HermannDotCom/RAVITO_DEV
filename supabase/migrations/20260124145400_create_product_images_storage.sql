/*
  # Setup Supabase Storage for product images
  
  ## Purpose
  Configure storage bucket and policies for product images.
  
  ## IMPORTANT
  In Supabase, buckets must be created via Dashboard or Storage API.
  This script only adds policies to an existing bucket.
*/

-- WARNING: Buckets cannot be created via SQL in Supabase
-- You must FIRST create the bucket manually via:
-- 1. Supabase Dashboard → Storage → New Bucket
-- 2. Name: "product-images"
-- 3. Set to Public: ON

-- 1. Check if bucket exists before adding policies
DO $$
BEGIN
  -- Check if the bucket exists in storage.buckets
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    
    -- 2. Policy: Public read access (only if not exists)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read access for product images'
    ) THEN
      CREATE POLICY "Public read access for product images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
    END IF;
    
    -- 3. Policy: Admin can upload (only if not exists)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admin can upload product images'
    ) THEN
      CREATE POLICY "Admin can upload product images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
    END IF;
    
    -- 4. Policy: Admin can update (only if not exists)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admin can update product images'
    ) THEN
      CREATE POLICY "Admin can update product images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
    END IF;
    
    -- 5. Policy: Admin can delete (only if not exists)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admin can delete product images'
    ) THEN
      CREATE POLICY "Admin can delete product images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
    END IF;
    
    RAISE NOTICE 'Storage policies for product-images bucket configured successfully.';
    
  ELSE
    RAISE WARNING 'Bucket "product-images" does not exist. Please create it first via Supabase Dashboard → Storage.';
  END IF;
END $$;
