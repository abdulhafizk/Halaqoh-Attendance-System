-- Update profiles table to add login tracking fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    last_login = NOW(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Create view for login statistics
CREATE OR REPLACE VIEW user_login_stats AS
SELECT 
  id,
  username,
  COALESCE(full_name, username) as full_name,
  role,
  last_login,
  COALESCE(login_count, 0) as login_count,
  COALESCE(is_active, true) as is_active,
  created_at
FROM profiles
WHERE COALESCE(is_active, true) = true;

-- Grant permissions
GRANT SELECT ON user_login_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_login(UUID) TO authenticated;

-- Update existing profiles with default values
UPDATE profiles 
SET 
  full_name = COALESCE(full_name, username),
  login_count = COALESCE(login_count, 0),
  is_active = COALESCE(is_active, true)
WHERE full_name IS NULL OR login_count IS NULL OR is_active IS NULL;
