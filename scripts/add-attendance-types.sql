-- Add new attendance types columns
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS alpha BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sakit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS izin BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN attendance.alpha IS 'Status Alpha - hanya bisa diakses oleh Admin dan Masul Tahfidz';
COMMENT ON COLUMN attendance.sakit IS 'Status Sakit - hanya bisa diakses oleh Admin dan Masul Tahfidz';
COMMENT ON COLUMN attendance.izin IS 'Status Izin - hanya bisa diakses oleh Admin dan Masul Tahfidz';

-- Update existing records to ensure consistency
UPDATE attendance SET alpha = FALSE WHERE alpha IS NULL;
UPDATE attendance SET sakit = FALSE WHERE sakit IS NULL;
UPDATE attendance SET izin = FALSE WHERE izin IS NULL;
