-- Fix memorization table to match the recap requirements
ALTER TABLE memorization 
ADD COLUMN IF NOT EXISTS surah TEXT,
ADD COLUMN IF NOT EXISTS ayah_from INTEGER,
ADD COLUMN IF NOT EXISTS ayah_to INTEGER;

-- Update existing records if any
UPDATE memorization 
SET surah = 'Al-Fatihah', ayah_from = 1, ayah_to = 7 
WHERE surah IS NULL;
