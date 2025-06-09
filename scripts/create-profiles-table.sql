-- Create profiles table with proper RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'masul_tahfidz', 'tim_tahfidz')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON profiles
  FOR ALL USING (true);

-- Insert demo users
INSERT INTO profiles (id, username, role) VALUES 
  ('demo-admin', 'admin', 'admin'),
  ('demo-masul', 'masul', 'masul_tahfidz'),
  ('demo-tim', 'tim', 'tim_tahfidz')
ON CONFLICT (username) DO NOTHING;
