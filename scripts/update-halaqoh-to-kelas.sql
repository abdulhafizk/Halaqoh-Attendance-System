-- Update column names from halaqoh to kelas
ALTER TABLE ustadz RENAME COLUMN halaqoh TO kelas;
ALTER TABLE santri RENAME COLUMN halaqoh TO kelas;

-- Update any existing data references (if needed)
-- This script assumes the column rename is the main change needed

-- Add comments to clarify the new column purpose
COMMENT ON COLUMN ustadz.kelas IS 'Kelas yang diampu oleh ustadz';
COMMENT ON COLUMN santri.kelas IS 'Kelas tempat santri belajar';
