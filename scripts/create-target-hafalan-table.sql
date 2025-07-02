-- Create target_hafalan table
CREATE TABLE IF NOT EXISTS target_hafalan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas TEXT NOT NULL UNIQUE,
  target_juz NUMERIC(4,1) NOT NULL DEFAULT 0,
  merah_min NUMERIC(4,1) NOT NULL DEFAULT 0,
  merah_max NUMERIC(4,1) NOT NULL DEFAULT 4,
  kuning_min NUMERIC(4,1) NOT NULL DEFAULT 4.1,
  kuning_max NUMERIC(4,1) NOT NULL DEFAULT 7,
  hijau_min NUMERIC(4,1) NOT NULL DEFAULT 7.1,
  hijau_max NUMERIC(4,1) NOT NULL DEFAULT 11.4,
  biru_min NUMERIC(4,1) NOT NULL DEFAULT 11.5,
  biru_max NUMERIC(4,1) NOT NULL DEFAULT 20,
  pink_threshold NUMERIC(4,1) NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE target_hafalan ENABLE ROW LEVEL SECURITY;

-- Create policy for target_hafalan
CREATE POLICY "Allow all operations on target_hafalan" ON target_hafalan
  FOR ALL USING (true);

-- Insert default targets for existing classes
INSERT INTO target_hafalan (kelas, target_juz) 
SELECT DISTINCT halaqoh, 10.0 
FROM ustadz 
WHERE halaqoh IS NOT NULL AND halaqoh != ''
ON CONFLICT (kelas) DO NOTHING;

-- Add index for better performance
CREATE INDEX idx_target_hafalan_kelas ON target_hafalan(kelas);

-- Add comments
COMMENT ON TABLE target_hafalan IS 'Target hafalan dan kategori warna untuk setiap kelas';
COMMENT ON COLUMN target_hafalan.target_juz IS 'Target hafalan dalam Juz untuk kelas ini';
COMMENT ON COLUMN target_hafalan.merah_min IS 'Batas minimum kategori merah';
COMMENT ON COLUMN target_hafalan.merah_max IS 'Batas maksimum kategori merah';
COMMENT ON COLUMN target_hafalan.pink_threshold IS 'Batas untuk kategori pink (30 Juz = hafal semua)';
