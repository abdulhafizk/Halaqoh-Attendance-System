-- First, let's check if we need to update the table structure
-- Drop the old table if it exists with wrong structure
DROP TABLE IF EXISTS target_hafalan;

-- Create the target_hafalan table with correct structure (per kelas, not per santri)
CREATE TABLE target_hafalan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kelas TEXT NOT NULL UNIQUE, -- One target per class
    target_juz DECIMAL(4,1) NOT NULL,
    merah_min DECIMAL(4,1) DEFAULT 0,
    merah_max DECIMAL(4,1) DEFAULT 4,
    kuning_min DECIMAL(4,1) DEFAULT 4.1,
    kuning_max DECIMAL(4,1) DEFAULT 7,
    hijau_min DECIMAL(4,1) DEFAULT 7.1,
    hijau_max DECIMAL(4,1) DEFAULT 11.4,
    biru_min DECIMAL(4,1) DEFAULT 11.5,
    biru_max DECIMAL(4,1) DEFAULT 20,
    pink_threshold DECIMAL(4,1) DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE target_hafalan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view target_hafalan" ON target_hafalan
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert target_hafalan" ON target_hafalan
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update target_hafalan" ON target_hafalan
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete target_hafalan" ON target_hafalan
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO target_hafalan (kelas, target_juz, merah_max, kuning_max, hijau_max, biru_max, pink_threshold) VALUES
('Kelas 7', 10.0, 4.0, 7.0, 11.4, 20.0, 30.0),
('Kelas 8', 15.0, 6.0, 10.5, 17.1, 25.0, 30.0),
('Kelas 9', 20.0, 8.0, 14.0, 22.8, 30.0, 30.0);

-- Create index for better performance
CREATE INDEX idx_target_hafalan_kelas ON target_hafalan(kelas);
