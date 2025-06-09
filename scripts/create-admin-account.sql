-- Create a profile for the admin user
-- Note: The id should match the UUID from the auth.users table after you create the user
INSERT INTO profiles (id, username, role, created_at, updated_at)
VALUES 
  ('REPLACE_WITH_AUTH_USER_ID', 'admin_real', 'admin', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
