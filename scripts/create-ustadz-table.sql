-- Create ustadz table
CREATE TABLE IF NOT EXISTS ustadz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  halaqoh TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ustadz ENABLE ROW LEVEL SECURITY;

-- Create policy for ustadz
CREATE POLICY "Allow all operations on ustadz" ON ustadz
  FOR ALL USING (true);

-- Insert some demo data
INSERT INTO ustadz (name, halaqoh, phone, address) VALUES 
  ('Ustadz Ahmad', 'Halaqoh A', '08123456789', 'Jl. Masjid No. 1'),
  ('Ustadz Budi', 'Halaqoh B', '08987654321', 'Jl. Pondok No. 2'),
  ('Ustadz Candra', 'Halaqoh C', '08555666777', 'Jl. Tahfidz No. 3')
ON CONFLICT DO NOTHING;
