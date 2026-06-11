-- Utilisateurs fictifs pour les tests / démo
-- Aucun lien avec auth Supabase (auth.users) : uniquement la table métier public.utilisateurs
-- SQL Editor → Run. Réexécutable : upsert sur id_utilisateur (corrige aussi l’e-mail des seeds anciens).

INSERT INTO public.utilisateurs (
  id_utilisateur,
  email,
  nom,
  prenom,
  age,
  sexe,
  poids,
  taille,
  objectifs,
  type_abonnement
)
VALUES
  (
    'b2000000-0000-4000-8000-000000000001'::uuid,
    'claire.martin.demo@example.com',
    'Martin',
    'Claire',
    28,
    'F',
    62.50,
    168.00,
    ARRAY['Perte de poids', 'Marche quotidienne'],
    'freemium'
  ),
  (
    'b2000000-0000-4000-8000-000000000002'::uuid,
    'thomas.bernard.demo@example.com',
    'Bernard',
    'Thomas',
    35,
    'M',
    82.00,
    181.00,
    ARRAY['Prise de masse', 'Musculation'],
    'premium'
  ),
  (
    'b2000000-0000-4000-8000-000000000003'::uuid,
    'lea.nguyen.demo@example.com',
    'Nguyen',
    'Léa',
    22,
    'F',
    55.00,
    162.00,
    ARRAY['Maintien', 'Course à pied'],
    'freemium'
  ),
  (
    'b2000000-0000-4000-8000-000000000004'::uuid,
    'hugo.petit.demo@example.com',
    'Petit',
    'Hugo',
    41,
    'M',
    76.20,
    175.00,
    ARRAY['Réduction du stress', 'Sommeil'],
    'premium+'
  ),
  (
    'b2000000-0000-4000-8000-000000000005'::uuid,
    'amina.kone.demo@example.com',
    'Koné',
    'Amina',
    30,
    'F',
    70.00,
    170.00,
    ARRAY['Alimentation équilibrée'],
    'B2B'
  ),
  (
    'b2000000-0000-4000-8000-000000000006'::uuid,
    'jules.durand.demo@example.com',
    'Durand',
    'Jules',
    19,
    'M',
    68.50,
    178.00,
    ARRAY['Sport études', 'Endurance'],
    'freemium'
  ),
  (
    'b2000000-0000-4000-8000-000000000007'::uuid,
    'camille.rousseau.demo@example.com',
    'Rousseau',
    'Camille',
    45,
    'Autre',
    72.00,
    165.00,
    ARRAY['Santé globale', 'Yoga'],
    'premium'
  ),
  (
    'b2000000-0000-4000-8000-000000000008'::uuid,
    'kevin.lopez.demo@example.com',
    'Lopez',
    'Kévin',
    52,
    'M',
    88.00,
    172.00,
    ARRAY['Reprise d''activité', 'Marche'],
    'freemium'
  )
ON CONFLICT (id_utilisateur) DO UPDATE SET
  email = EXCLUDED.email,
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  age = EXCLUDED.age,
  sexe = EXCLUDED.sexe,
  poids = EXCLUDED.poids,
  taille = EXCLUDED.taille,
  objectifs = EXCLUDED.objectifs,
  type_abonnement = EXCLUDED.type_abonnement,
  updated_at = NOW();
