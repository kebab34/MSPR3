-- Recettes d'exemple + ingrédients (table recette_aliments)
-- Prérequis : exécuter d'abord seed_aliments_demo.sql (noms d'aliments identiques).
-- SQL Editor Supabase → coller → Run

INSERT INTO public.recettes (id_recette, nom, description, temps_preparation, nombre_personnes, difficulte)
VALUES
  (
    'a1000000-0000-4000-8000-000000000001'::uuid,
    'Omelette simple',
    'Battre les œufs avec une pincée de sel. Faire fondre le beurre dans une poêle antiadhésive, verser les œufs, cuire à feu doux en ramenant les bords vers le centre jusqu''à consistance désirée.',
    10,
    2,
    'facile'
  ),
  (
    'a1000000-0000-4000-8000-000000000002'::uuid,
    'Salade tomate, concombre et huile d''olive',
    'Couper tomates et concombre en morceaux. Assaisonner avec l''huile d''olive, sel et poivre. Servir frais.',
    15,
    4,
    'facile'
  ),
  (
    'a1000000-0000-4000-8000-000000000003'::uuid,
    'Poulet riz',
    'Cuire le riz. Faire revenir ou griller le poulet coupé en lamelles, assaisonner. Servir le poulet sur le riz bien chaud.',
    35,
    4,
    'moyen'
  ),
  (
    'a1000000-0000-4000-8000-000000000004'::uuid,
    'Pâtes au thon et tomates',
    'Cuire les pâtes al dente. Émietter le thon, ajouter les tomates en dés (crues ou légèrement poêlées). Mélanger le tout, ajouter un filet d''huile d''olive.',
    25,
    3,
    'facile'
  ),
  (
    'a1000000-0000-4000-8000-000000000005'::uuid,
    'Bol saumon, avocat et riz',
    'Cuire le riz. Couper le saumon en dés (sashimi ou légèrement saisi) et l''avocat en lamelles. Dresser en bol avec le riz.',
    30,
    2,
    'moyen'
  ),
  (
    'a1000000-0000-4000-8000-000000000006'::uuid,
    'Yaourt aux fraises',
    'Laver et couper les fraises. Mélanger avec le yaourt nature. Ajouter un peu de miel si besoin.',
    5,
    2,
    'facile'
  )
ON CONFLICT (id_recette) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  temps_preparation = EXCLUDED.temps_preparation,
  nombre_personnes = EXCLUDED.nombre_personnes,
  difficulte = EXCLUDED.difficulte,
  updated_at = NOW();

-- quantite : grammes pour les solides, millilitres pour liquides (huile, lait), cohérent avec les fiches aliments « pour 100 g / 100 ml »
INSERT INTO public.recette_aliments (id_recette, id_aliment, quantite)
VALUES
  ('a1000000-0000-4000-8000-000000000001'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Oeuf' LIMIT 1), 180),
  ('a1000000-0000-4000-8000-000000000001'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Beurre' LIMIT 1), 15),
  ('a1000000-0000-4000-8000-000000000002'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Tomate' LIMIT 1), 250),
  ('a1000000-0000-4000-8000-000000000002'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Concombre' LIMIT 1), 200),
  ('a1000000-0000-4000-8000-000000000002'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Huile d''olive' LIMIT 1), 20),
  ('a1000000-0000-4000-8000-000000000003'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Filet de poulet grillé' LIMIT 1), 400),
  ('a1000000-0000-4000-8000-000000000003'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Riz blanc cuit' LIMIT 1), 300),
  ('a1000000-0000-4000-8000-000000000004'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Pâtes cuites' LIMIT 1), 300),
  ('a1000000-0000-4000-8000-000000000004'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Thon au naturel' LIMIT 1), 120),
  ('a1000000-0000-4000-8000-000000000004'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Tomate' LIMIT 1), 150),
  ('a1000000-0000-4000-8000-000000000004'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Huile d''olive' LIMIT 1), 15),
  ('a1000000-0000-4000-8000-000000000005'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Saumon cru' LIMIT 1), 200),
  ('a1000000-0000-4000-8000-000000000005'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Avocat' LIMIT 1), 100),
  ('a1000000-0000-4000-8000-000000000005'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Riz blanc cuit' LIMIT 1), 200),
  ('a1000000-0000-4000-8000-000000000006'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Yaourt nature' LIMIT 1), 250),
  ('a1000000-0000-4000-8000-000000000006'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Fraise' LIMIT 1), 150),
  ('a1000000-0000-4000-8000-000000000006'::uuid, (SELECT id_aliment FROM public.aliments WHERE nom = 'Miel' LIMIT 1), 15)
ON CONFLICT (id_recette, id_aliment) DO UPDATE SET
  quantite = EXCLUDED.quantite;
