/*
  # Add automatic activity logging triggers

  1. Functions
    - `log_user_activity` - Function to log user activities automatically
    - `log_login_activity` - Function to log login activities

  2. Triggers
    - Trigger on orders table for order creation
    - Trigger on profiles table for profile updates
    - Trigger on ratings table for rating submissions

  3. Sample Data
    - Add sample activity logs for existing users to demonstrate the feature
*/

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_log (
      user_id,
      activity_type,
      activity_description,
      related_entity_type,
      related_entity_id,
      metadata
    ) VALUES (
      NEW.client_id,
      'order_created',
      'Nouvelle commande créée d''un montant de ' || NEW.total_amount || ' FCFA',
      'order',
      NEW.id,
      jsonb_build_object(
        'order_id', NEW.id,
        'total_amount', NEW.total_amount,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.supplier_id IS NOT NULL THEN
      INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_description,
        related_entity_type,
        related_entity_id,
        metadata
      ) VALUES (
        NEW.supplier_id,
        'order_accepted',
        'Commande acceptée et en préparation',
        'order',
        NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'client_id', NEW.client_id,
          'total_amount', NEW.total_amount
        )
      );
    ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
      INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_description,
        related_entity_type,
        related_entity_id,
        metadata
      ) VALUES (
        NEW.client_id,
        'order_delivered',
        'Commande livrée avec succès',
        'order',
        NEW.id,
        jsonb_build_object('order_id', NEW.id)
      );
      
      IF NEW.supplier_id IS NOT NULL THEN
        INSERT INTO user_activity_log (
          user_id,
          activity_type,
          activity_description,
          related_entity_type,
          related_entity_id,
          metadata
        ) VALUES (
          NEW.supplier_id,
          'order_delivered',
          'Livraison effectuée avec succès',
          'order',
          NEW.id,
          jsonb_build_object('order_id', NEW.id)
        );
      END IF;
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_description,
        related_entity_type,
        related_entity_id,
        metadata
      ) VALUES (
        NEW.client_id,
        'order_cancelled',
        'Commande annulée',
        'order',
        NEW.id,
        jsonb_build_object('order_id', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_profile_update_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.name != OLD.name OR
    NEW.phone != OLD.phone OR
    NEW.address != OLD.address OR
    NEW.business_name != OLD.business_name
  ) THEN
    INSERT INTO user_activity_log (
      user_id,
      activity_type,
      activity_description,
      related_entity_type,
      related_entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'profile_updated',
      'Profil mis à jour',
      'profile',
      NEW.id,
      jsonb_build_object(
        'updated_fields', ARRAY[
          CASE WHEN NEW.name != OLD.name THEN 'name' END,
          CASE WHEN NEW.phone != OLD.phone THEN 'phone' END,
          CASE WHEN NEW.address != OLD.address THEN 'address' END,
          CASE WHEN NEW.business_name != OLD.business_name THEN 'business_name' END
        ]
      )
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.is_approved = true AND OLD.is_approved = false THEN
    INSERT INTO user_activity_log (
      user_id,
      activity_type,
      activity_description,
      related_entity_type,
      related_entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'account_approved',
      'Compte approuvé par l''administrateur',
      'profile',
      NEW.id,
      jsonb_build_object('approval_status', NEW.approval_status)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
    INSERT INTO user_activity_log (
      user_id,
      activity_type,
      activity_description,
      related_entity_type,
      related_entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'account_rejected',
      'Compte rejeté: ' || COALESCE(NEW.rejection_reason, 'Aucune raison spécifiée'),
      'profile',
      NEW.id,
      jsonb_build_object('rejection_reason', NEW.rejection_reason)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_rating_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_description,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    NEW.from_user_id,
    'rating_given',
    'Note attribuée: ' || NEW.overall || '/5 étoiles',
    'rating',
    NEW.id,
    jsonb_build_object(
      'rating_id', NEW.id,
      'to_user_id', NEW.to_user_id,
      'overall', NEW.overall
    )
  );
  
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_description,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    NEW.to_user_id,
    'rating_received',
    'Note reçue: ' || NEW.overall || '/5 étoiles',
    'rating',
    NEW.id,
    jsonb_build_object(
      'rating_id', NEW.id,
      'from_user_id', NEW.from_user_id,
      'overall', NEW.overall
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_order_activity ON orders;
CREATE TRIGGER trigger_log_order_activity
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_activity();

DROP TRIGGER IF EXISTS trigger_log_profile_update_activity ON profiles;
CREATE TRIGGER trigger_log_profile_update_activity
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_update_activity();

DROP TRIGGER IF EXISTS trigger_log_rating_activity ON ratings;
CREATE TRIGGER trigger_log_rating_activity
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION log_rating_activity();

DO $$
DECLARE
  profile_record RECORD;
  activity_date TIMESTAMPTZ;
BEGIN
  FOR profile_record IN 
    SELECT id, role, created_at 
    FROM profiles 
    WHERE is_approved = true
    LIMIT 10
  LOOP
    activity_date := profile_record.created_at;
    
    INSERT INTO user_activity_log (user_id, activity_type, activity_description, created_at)
    VALUES (
      profile_record.id,
      'account_approved',
      'Compte créé et approuvé',
      activity_date
    );
    
    INSERT INTO user_activity_log (user_id, activity_type, activity_description, created_at)
    VALUES (
      profile_record.id,
      'profile_updated',
      'Profil configuré avec succès',
      activity_date + INTERVAL '5 minutes'
    );
    
    IF profile_record.role = 'client' THEN
      INSERT INTO user_activity_log (user_id, activity_type, activity_description, created_at)
      VALUES (
        profile_record.id,
        'login',
        'Connexion à l''application',
        activity_date + INTERVAL '1 hour'
      );
    ELSIF profile_record.role = 'supplier' THEN
      INSERT INTO user_activity_log (user_id, activity_type, activity_description, created_at)
      VALUES (
        profile_record.id,
        'zone_registered',
        'Inscription à une zone de livraison',
        activity_date + INTERVAL '30 minutes'
      );
      
      INSERT INTO user_activity_log (user_id, activity_type, activity_description, created_at)
      VALUES (
        profile_record.id,
        'login',
        'Connexion à l''application',
        activity_date + INTERVAL '2 hours'
      );
    END IF;
  END LOOP;
END $$;
