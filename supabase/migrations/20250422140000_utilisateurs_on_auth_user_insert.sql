-- Ligne métier public.utilisateurs créée automatiquement pour chaque nouvel utilisateur Auth.
-- Évite la dépendance à l’insertion via l’API (réseau Docker, erreurs silencieuses, etc.).

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.utilisateurs (
    email,
    auth_id,
    app_role,
    type_abonnement,
    nom,
    prenom
  )
  VALUES (
    NEW.email,
    NEW.id,
    'user',
    'freemium',
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'nom'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'prenom'), '')
  )
  ON CONFLICT (email) DO UPDATE
    SET
      auth_id = EXCLUDED.auth_id,
      nom = COALESCE(EXCLUDED.nom, public.utilisateurs.nom),
      prenom = COALESCE(EXCLUDED.prenom, public.utilisateurs.prenom),
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Crée ou met à jour public.utilisateurs quand un compte apparaît dans auth.users';
