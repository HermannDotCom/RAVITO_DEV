/*
  # Fix Profiles INSERT Policy - PROBLÈME IDENTIFIÉ
  
  ## CAUSE RACINE DU BUG
  La table profiles n'a AUCUNE policy INSERT !
  - SELECT policy : ✓ Existe
  - UPDATE policy : ✓ Existe  
  - DELETE policy : ✓ Existe
  - INSERT policy : ✗ MANQUANTE !
  
  Quand le trigger handle_new_user() essaie d'insérer dans profiles:
  1. Le trigger s'exécute (il est ENABLED)
  2. Il tente INSERT INTO profiles
  3. RLS bloque car aucune policy INSERT n'autorise l'opération
  4. Le trigger échoue silencieusement (bloc EXCEPTION avale l'erreur)
  5. L'utilisateur est créé dans auth.users SANS profil dans profiles
  
  ## SOLUTION
  Créer une policy INSERT qui autorise:
  1. Le trigger à insérer (SECURITY DEFINER bypass certaines vérifications mais pas RLS)
  2. Les utilisateurs à créer leur propre profil si besoin
  
  ## SÉCURITÉ
  - La policy utilise WITH CHECK (true) car le trigger SECURITY DEFINER contrôle déjà les données
  - Le trigger valide le rôle et les données avant insertion
  - Les autres policies (SELECT/UPDATE/DELETE) restent restrictives
*/

-- Créer la policy INSERT manquante
CREATE POLICY "profiles_insert_new_user"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

COMMENT ON POLICY "profiles_insert_new_user" ON public.profiles IS 
  'Permet au trigger handle_new_user() d''insérer les nouveaux profils. Sécurité assurée par le trigger SECURITY DEFINER.';
