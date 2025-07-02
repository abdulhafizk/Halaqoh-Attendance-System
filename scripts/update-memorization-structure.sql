-- Update memorization table structure to accommodate the new Juz-based system
-- The existing columns will be repurposed:
-- - date: still used for tracking when the record was created
-- - surah: will store "Total Hafalan" as default
-- - ayah_from: will store 0 as default
-- - ayah_to: will store the total hafalan in Juz (can be decimal)
-- - quality and notes remain the same

-- Add a comment to clarify the new usage
COMMENT ON COLUMN memorization.ayah_to IS 'Stores total hafalan in Juz (can be decimal, e.g., 2.5)';
COMMENT ON COLUMN memorization.surah IS 'Stores "Total Hafalan" for new Juz-based records';
COMMENT ON COLUMN memorization.ayah_from IS 'Stores 0 for new Juz-based records';

-- Update any existing records to follow the new format (optional)
-- This is commented out to preserve existing data
-- UPDATE memorization SET 
--   surah = 'Total Hafalan',
--   ayah_from = 0
-- WHERE surah != 'Total Hafalan';
