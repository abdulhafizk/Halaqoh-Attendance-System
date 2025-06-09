-- Create santri table
CREATE TABLE IF NOT EXISTS santri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  halaqoh TEXT NOT NULL,
  age TEXT,
  parent_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ustadz_id UUID REFERENCES ustadz(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sabaq BOOLEAN DEFAULT FALSE,
  sabqi BOOLEAN DEFAULT FALSE,
  manzil BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memorization table
CREATE TABLE IF NOT EXISTS memorization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id UUID REFERENCES santri(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_setoran INTEGER DEFAULT 0,
  total_hafalan INTEGER DEFAULT 0,
  quality TEXT CHECK (quality IN ('Baik', 'Cukup', 'Kurang')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqoh TEXT NOT NULL,
  day TEXT NOT NULL,
  sabaq_time TIME,
  sabqi_time TIME,
  manzil_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Allow all operations on santri" ON santri FOR ALL USING (true);
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all operations on memorization" ON memorization FOR ALL USING (true);
CREATE POLICY "Allow all operations on schedule" ON schedule FOR ALL USING (true);

-- Insert demo santri data
INSERT INTO santri (name, halaqoh, age, parent_name, phone, address) VALUES 
  ('Ahmad Santri', 'Halaqoh A', '12 tahun', 'Bapak Ahmad', '08111222333', 'Jl. Santri No. 1'),
  ('Budi Santri', 'Halaqoh A', '13 tahun', 'Bapak Budi', '08444555666', 'Jl. Santri No. 2'),
  ('Candra Santri', 'Halaqoh B', '11 tahun', 'Bapak Candra', '08777888999', 'Jl. Santri No. 3'),
  ('Dedi Santri', 'Halaqoh B', '14 tahun', 'Bapak Dedi', '08000111222', 'Jl. Santri No. 4'),
  ('Eko Santri', 'Halaqoh C', '12 tahun', 'Bapak Eko', '08333444555', 'Jl. Santri No. 5')
ON CONFLICT DO NOTHING;
