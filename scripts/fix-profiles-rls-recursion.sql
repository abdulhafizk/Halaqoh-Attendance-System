-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile access" ON profiles;

-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Clear any existing problematic data
DELETE FROM profiles WHERE id LIKE 'demo-%';

-- Insert real admin profiles (these will be used with real Supabase auth)
INSERT INTO profiles (username, role, created_at, updated_at) VALUES 
  ('admin_tahfidz', 'admin', NOW(), NOW()),
  ('koordinator_tahfidz', 'masul_tahfidz', NOW(), NOW()),
  ('pengajar_tahfidz', 'tim_tahfidz', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Re-enable RLS with a simple, non-recursive policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to read their own profile
-- and allows service role to do everything
CREATE POLICY "Allow authenticated users to read own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Allow service role to insert profiles" ON profiles
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role to delete profiles" ON profiles
  FOR DELETE 
  USING (auth.role() = 'service_role');
