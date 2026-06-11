-- ============================================
-- Script SQL complet pour créer toutes les tables
-- HealthAI Coach - Backend Métier
-- ============================================
-- 
-- Instructions :
-- 1. Ouvrir Supabase Dashboard local: http://localhost:54323
-- 2. Aller dans SQL Editor
-- 3. Cliquer sur "New Query"
-- 4. Coller ce script complet
-- 5. Cliquer sur "Run" ou appuyer sur Ctrl+Enter
--
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Table: UTILISATEURS
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id_utilisateur UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nom TEXT,
    prenom TEXT,
    age INTEGER CHECK (age > 0 AND age < 150),
    sexe TEXT CHECK (sexe IN ('M', 'F', 'Autre')),
    poids DECIMAL(5,2) CHECK (poids > 0),
    taille DECIMAL(5,2) CHECK (taille > 0),
    objectifs TEXT[] DEFAULT '{}',
    type_abonnement TEXT DEFAULT 'freemium' CHECK (type_abonnement IN ('freemium', 'premium', 'premium+', 'B2B')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_type_abonnement ON utilisateurs(type_abonnement);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_created_at ON utilisateurs(created_at DESC);

CREATE TRIGGER update_utilisateurs_updated_at 
    BEFORE UPDATE ON utilisateurs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: OBJECTIFS
-- ============================================
CREATE TABLE IF NOT EXISTS objectifs (
    id_objectif UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_objectif TEXT NOT NULL,
    description TEXT,
    id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_objectifs_utilisateur ON objectifs(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_objectifs_type ON objectifs(type_objectif);

CREATE TRIGGER update_objectifs_updated_at 
    BEFORE UPDATE ON objectifs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: ALIMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS aliments (
    id_aliment UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    calories DECIMAL(10,2) DEFAULT 0 CHECK (calories >= 0),
    proteines DECIMAL(10,2) DEFAULT 0 CHECK (proteines >= 0),
    glucides DECIMAL(10,2) DEFAULT 0 CHECK (glucides >= 0),
    lipides DECIMAL(10,2) DEFAULT 0 CHECK (lipides >= 0),
    fibres DECIMAL(10,2) DEFAULT 0 CHECK (fibres >= 0),
    unite TEXT DEFAULT '100g',
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aliments_nom ON aliments(nom);
CREATE INDEX IF NOT EXISTS idx_aliments_calories ON aliments(calories);

CREATE TRIGGER update_aliments_updated_at 
    BEFORE UPDATE ON aliments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: RECETTES
-- ============================================
CREATE TABLE IF NOT EXISTS recettes (
    id_recette UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    description TEXT,
    temps_preparation INTEGER CHECK (temps_preparation >= 0),
    nombre_personnes INTEGER DEFAULT 1 CHECK (nombre_personnes > 0),
    difficulte TEXT CHECK (difficulte IN ('facile', 'moyen', 'difficile')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recettes_nom ON recettes(nom);

CREATE TRIGGER update_recettes_updated_at 
    BEFORE UPDATE ON recettes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: RECETTE_ALIMENTS (table associative)
-- ============================================
CREATE TABLE IF NOT EXISTS recette_aliments (
    id_recette UUID REFERENCES recettes(id_recette) ON DELETE CASCADE,
    id_aliment UUID REFERENCES aliments(id_aliment) ON DELETE CASCADE,
    quantite DECIMAL(10,2) NOT NULL CHECK (quantite > 0),
    PRIMARY KEY (id_recette, id_aliment)
);

CREATE INDEX IF NOT EXISTS idx_recette_aliments_recette ON recette_aliments(id_recette);
CREATE INDEX IF NOT EXISTS idx_recette_aliments_aliment ON recette_aliments(id_aliment);

-- ============================================
-- Table: JOURNAL_ALIMENTAIRE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_alimentaire (
    id_journal UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_consommation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantite DECIMAL(10,2) NOT NULL CHECK (quantite > 0),
    id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    id_aliment UUID REFERENCES aliments(id_aliment) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_utilisateur ON journal_alimentaire(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_alimentaire(date_consommation DESC);
CREATE INDEX IF NOT EXISTS idx_journal_aliment ON journal_alimentaire(id_aliment);

CREATE TRIGGER update_journal_updated_at 
    BEFORE UPDATE ON journal_alimentaire 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: EXERCICES
-- ============================================
CREATE TABLE IF NOT EXISTS exercices (
    id_exercice UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('force', 'cardio', 'flexibilite', 'autre')),
    groupe_musculaire TEXT,
    niveau TEXT DEFAULT 'debutant' CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
    equipement TEXT,
    description TEXT,
    instructions TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercices_nom ON exercices(nom);
CREATE INDEX IF NOT EXISTS idx_exercices_type ON exercices(type);
CREATE INDEX IF NOT EXISTS idx_exercices_niveau ON exercices(niveau);

CREATE TRIGGER update_exercices_updated_at 
    BEFORE UPDATE ON exercices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: SESSIONS_SPORT
-- ============================================
CREATE TABLE IF NOT EXISTS sessions_sport (
    id_session UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_session TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duree INTEGER CHECK (duree > 0), -- en minutes
    intensite TEXT CHECK (intensite IN ('faible', 'moderee', 'elevee')),
    id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_utilisateur ON sessions_sport(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions_sport(date_session DESC);

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions_sport 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: SESSION_EXERCICES (table associative)
-- ============================================
CREATE TABLE IF NOT EXISTS session_exercices (
    id_session UUID REFERENCES sessions_sport(id_session) ON DELETE CASCADE,
    id_exercice UUID REFERENCES exercices(id_exercice) ON DELETE CASCADE,
    nombre_series INTEGER DEFAULT 1 CHECK (nombre_series > 0),
    nombre_repetitions INTEGER CHECK (nombre_repetitions > 0),
    poids DECIMAL(5,2) CHECK (poids >= 0),
    duree INTEGER CHECK (duree > 0), -- en secondes
    PRIMARY KEY (id_session, id_exercice)
);

CREATE INDEX IF NOT EXISTS idx_session_exercices_session ON session_exercices(id_session);
CREATE INDEX IF NOT EXISTS idx_session_exercices_exercice ON session_exercices(id_exercice);

-- ============================================
-- Table: MESURES_BIOMETRIQUES
-- ============================================
CREATE TABLE IF NOT EXISTS mesures_biometriques (
    id_mesure UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_mesure TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    poids DECIMAL(5,2) CHECK (poids > 0),
    frequence_cardiaque INTEGER CHECK (frequence_cardiaque > 0),
    sommeil DECIMAL(4,2) CHECK (sommeil >= 0), -- en heures
    calories_brulees DECIMAL(10,2) DEFAULT 0 CHECK (calories_brulees >= 0),
    id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesures_utilisateur ON mesures_biometriques(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_mesures_date ON mesures_biometriques(date_mesure DESC);

CREATE TRIGGER update_mesures_updated_at 
    BEFORE UPDATE ON mesures_biometriques 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: PROGRESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS progressions (
    id_progression UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    id_exercice UUID REFERENCES exercices(id_exercice) ON DELETE CASCADE,
    date_progression TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valeur_avant DECIMAL(10,2),
    valeur_apres DECIMAL(10,2),
    type_progression TEXT, -- ex: "poids", "repetitions", "duree"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progressions_utilisateur ON progressions(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_progressions_exercice ON progressions(id_exercice);
CREATE INDEX IF NOT EXISTS idx_progressions_date ON progressions(date_progression DESC);

CREATE TRIGGER update_progressions_updated_at 
    BEFORE UPDATE ON progressions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE 'Tables créées avec succès.';
END $$;
