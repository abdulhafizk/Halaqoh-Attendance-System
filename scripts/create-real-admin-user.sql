-- Instructions for creating a real admin user:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create:
--    Email: admin@tahfidz.com
--    Password: admin123456
-- 3. Copy the User ID from the created user
-- 4. Run this SQL with the actual User ID:

-- Example (replace 'ACTUAL_USER_ID_FROM_SUPABASE' with the real UUID):
-- INSERT INTO profiles (id, username, role, created_at, updated_at)
-- VALUES ('ACTUAL_USER_ID_FROM_SUPABASE', 'admin_tahfidz', 'admin', NOW(), NOW())
-- ON CONFLICT (id) DO UPDATE SET
--   username = EXCLUDED.username,
--   role = EXCLUDED.role,
--   updated_at = NOW();

-- For now, we'll create placeholder profiles that can be linked later
INSERT INTO profiles (username, role, created_at, updated_at) VALUES 
  ('admin_tahfidz', 'admin', NOW(), NOW()),
  ('koordinator_tahfidz', 'masul_tahfidz', NOW(), NOW()),
  ('pengajar_tahfidz', 'tim_tahfidz', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Show current profiles
SELECT * FROM profiles;
