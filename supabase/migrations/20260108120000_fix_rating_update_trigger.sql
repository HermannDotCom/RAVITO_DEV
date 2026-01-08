-- 1. Créer la fonction pour mettre à jour la notation globale
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating REAL;
BEGIN
  -- Calculer la nouvelle moyenne des notes pour l'utilisateur qui a reçu la note
  SELECT AVG(overall) INTO avg_rating
  FROM public.ratings
  WHERE to_user_id = NEW.to_user_id;

  -- Mettre à jour la table des profils
  UPDATE public.profiles
  SET rating = avg_rating
  WHERE id = NEW.to_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer le trigger qui appelle la fonction après chaque insertion dans la table ratings
CREATE TRIGGER on_new_rating
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();
