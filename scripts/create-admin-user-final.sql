-- This script should be run AFTER creating a user in Supabase Auth Dashboard

-- First, create the user in Supabase Auth Dashboard:
-- Email: admin@tahfidz.com
-- Password: admin123456
-- Then copy the User ID and replace 'YOUR_USER_ID_HERE' below

-- Example: If your user ID is 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- UPDATE profiles SET id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE username = 'admin_tahfidz';

-- Replace YOUR_USER_ID_HERE with the actual User ID from Supabase Auth
UPDATE profiles 
SET id = 'YOUR_USER_ID_HERE' 
WHERE username = 'admin_tahfidz';

-- Verify the update
SELECT * FROM profiles WHERE username = 'admin_tahfidz';
