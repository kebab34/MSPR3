-- Humeur du jour et zones corporelles blessées (coach IA)
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS humeur TEXT CHECK (humeur IN ('content', 'normal', 'triste', 'colere')),
  ADD COLUMN IF NOT EXISTS zones_blessure TEXT[] DEFAULT '{}';

COMMENT ON COLUMN utilisateurs.humeur IS 'Humeur actuelle : content, normal, triste, colere';
COMMENT ON COLUMN utilisateurs.zones_blessure IS 'Identifiants des zones corporelles signalées comme blessées';
