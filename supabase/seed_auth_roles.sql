-- À exécuter après la création des comptes dans auth (API Admin ou interface).
-- Rôle application : public.utilisateurs.app_role ∈ ('admin', 'user')
-- Le « freemium » est le type d’abonnement (type_abonnement), pas le rôle applicatif.

-- Admin : rôle applicatif (accès back-office, etc.)
UPDATE public.utilisateurs
SET
  app_role = 'admin',
  updated_at = now()
WHERE email = 'admin@admin.com';

-- « freemium » = type d’abonnement (pas app_role, qui reste 'user' dans le schéma actuel)
UPDATE public.utilisateurs
SET
  app_role = 'user',
  type_abonnement = 'freemium',
  updated_at = now()
WHERE email = 'user@user.com';
