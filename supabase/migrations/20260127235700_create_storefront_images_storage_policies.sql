/*
  # Create Storefront Images Storage Policies
  
  ## Description
  Policies pour le bucket Supabase Storage "storefront-images"
  
  ## Prerequisites
  Le bucket "storefront-images" doit être créé manuellement via le Dashboard Supabase
  avec les paramètres suivants :
  - Nom: storefront-images
  - Public: true (pour permettre l'affichage des images)
  
  ## Security
  - Lecture publique pour toutes les images
  - Upload/modification/suppression uniquement pour le propriétaire (dossier = user_id)
*/

-- Policy: Public read access for storefront images
CREATE POLICY "Public read access for storefront images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'storefront-images');

-- Policy: Authenticated users can upload their storefront image
CREATE POLICY "Authenticated users can upload their storefront image"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'storefront-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own storefront image
CREATE POLICY "Users can update their own storefront image"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'storefront-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'storefront-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own storefront image
CREATE POLICY "Users can delete their own storefront image"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'storefront-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
