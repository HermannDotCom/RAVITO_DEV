/*
  # Système de notification pour complétion de profil  
  
  1. Nouveautés
    - Fonction trigger pour notifier l'admin quand un profil non-approuvé est complété
    - La notification est envoyée quand address + storefront_image_url sont renseignés
  
  2. Sécurité
    - Trigger uniquement pour les profils en attente d'approbation
    - Notification envoyée aux super admins
*/

-- Fonction pour notifier l'admin de la complétion du profil
CREATE OR REPLACE FUNCTION notify_admin_profile_completed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Ne notifier que si le profil n'est pas encore approuvé
  IF NEW.approval_status = 'pending' AND NEW.is_approved = false THEN
    -- Vérifier que l'adresse ET la photo de devanture sont renseignées
    IF NEW.address IS NOT NULL AND NEW.address != '' 
       AND NEW.storefront_image_url IS NOT NULL AND NEW.storefront_image_url != '' THEN
      
      -- Notifier tous les super admins
      FOR admin_id IN 
        SELECT id FROM profiles WHERE is_super_admin = true
      LOOP
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          data,
          read,
          created_at
        ) VALUES (
          admin_id,
          'Profil complété',
          NEW.name || ' (' || NEW.business_name || ') a complété son profil avec une adresse et une photo de devanture.',
          'info',
          jsonb_build_object(
            'user_id', NEW.id,
            'user_name', NEW.name,
            'business_name', NEW.business_name,
            'action', 'profile_completed'
          ),
          false,
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_profile_completed ON profiles;

-- Créer le trigger sur UPDATE de la table profiles
CREATE TRIGGER on_profile_completed
  AFTER UPDATE OF address, storefront_image_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_profile_completed();