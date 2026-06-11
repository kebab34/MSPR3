-- Lien compte Supabase Auth + rôle application (admin / user)
-- free vs premium : colonne type_abonnement existante (freemium, premium, …)

ALTER TABLE public.utilisateurs
  ADD COLUMN IF NOT EXISTS auth_id UUID;

ALTER TABLE public.utilisateurs
  ADD COLUMN IF NOT EXISTS app_role TEXT NOT NULL DEFAULT 'user'
  CHECK (app_role IN ('admin', 'user'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_auth_id
  ON public.utilisateurs(auth_id)
  WHERE auth_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'utilisateurs_auth_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.utilisateurs
        ADD CONSTRAINT utilisateurs_auth_id_fkey
        FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN undefined_table THEN
        NULL; -- Environnements sans schéma auth
    END;
  END IF;
END $$;

COMMENT ON COLUMN public.utilisateurs.auth_id IS 'UUID Supabase Auth (auth.users.id)';
COMMENT ON COLUMN public.utilisateurs.app_role IS 'admin: accès back-office / user: accès app standard';
