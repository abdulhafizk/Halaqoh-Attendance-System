-- First, let's completely drop and recreate the profiles table without any RLS
DROP TABLE IF EXISTS profiles CASCADE;

-- Create a simple profiles table without RLS
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'masul_tahfidz', 'tim_tahfidz')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Do NOT enable RLS at all
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; -- COMMENTED OUT

-- Insert default profiles with placeholder UUIDs
INSERT INTO profiles (id, username, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'koordinator', 'masul_tahfidz'),
  ('00000000-0000-0000-0000-000000000003', 'pengajar', 'tim_tahfidz');

-- Create an index for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_id ON profiles(id);

-- Verify the table structure
SELECT * FROM profiles;
