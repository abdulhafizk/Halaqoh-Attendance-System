-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON profiles;

-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, use a simpler policy that doesn't cause recursion
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow profile access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Make sure our demo and admin users exist
INSERT INTO profiles (id, username, role, created_at, updated_at) VALUES 
  ('demo-admin', 'admin', 'admin', NOW(), NOW()),
  ('demo-masul', 'masul', 'masul_tahfidz', NOW(), NOW()),
  ('demo-tim', 'tim', 'tim_tahfidz', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();
