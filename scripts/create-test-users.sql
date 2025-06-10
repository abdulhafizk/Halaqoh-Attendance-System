-- Create test users in Supabase Auth (run this after creating users in dashboard)

-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create these users:
--    - Email: admin@tahfidz.com, Password: admin123456
--    - Email: koordinator@tahfidz.com, Password: koordinator123
--    - Email: pengajar@tahfidz.com, Password: pengajar123

-- 3. After creating users, get their UUIDs and update the profiles table:

-- Example (replace with actual UUIDs from Supabase Auth):
-- UPDATE profiles SET id = 'actual-uuid-from-supabase-1' WHERE username = 'admin';
-- UPDATE profiles SET id = 'actual-uuid-from-supabase-2' WHERE username = 'koordinator';
-- UPDATE profiles SET id = 'actual-uuid-from-supabase-3' WHERE username = 'pengajar';

-- For now, let's verify our profiles exist:
SELECT * FROM profiles;

-- Test query to make sure there's no RLS issue:
SELECT username, role FROM profiles WHERE username = 'admin';
