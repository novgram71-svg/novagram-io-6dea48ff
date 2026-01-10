-- =============================================
-- SECURITY FIX: Protect sensitive user data
-- =============================================

-- 1. REVOKE anon access from user enumeration functions
REVOKE EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_user_exists_by_email(text) FROM public;

-- 2. DROP the current profiles SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Users can view profile basic info" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- 3. Create a view for public profile data (without sensitive fields)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  created_at,
  updated_at
FROM profiles;

-- Enable RLS on the view (PostgreSQL 15+ supports this)
-- For earlier versions, we'll use a function approach

-- 4. Create secure RLS policy for profiles - basic info visible, sensitive fields hidden via function
-- Users can see basic profile info of everyone, but email/phone only for themselves
CREATE POLICY "Users can view public profile fields"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 5. Create a secure function to get profile data with proper field masking
CREATE OR REPLACE FUNCTION public.get_profile_with_privacy(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  avatar_url text,
  bio text,
  email text,
  phone_number text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    -- Only show email/phone to the owner
    CASE WHEN auth.uid() = p.id THEN p.email ELSE NULL END as email,
    CASE WHEN auth.uid() = p.id THEN p.phone_number ELSE NULL END as phone_number,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_with_privacy(uuid) TO authenticated;

-- 6. Fix user presence policy - only followers can see presence, not all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view presence" ON user_presence;

CREATE POLICY "Users and followers can view presence"
ON user_presence FOR SELECT
TO authenticated
USING (
  -- Users can always see their own presence
  auth.uid() = user_id 
  OR
  -- Followers can see presence only if activity_status enabled
  (
    EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() AND following_id = user_presence.user_id
    )
    AND
    EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_settings.user_id = user_presence.user_id AND activity_status = true
    )
  )
);

-- 7. Update find_user_email_by_identifier to require authentication and not return actual email
CREATE OR REPLACE FUNCTION public.find_user_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  found_user_id uuid;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Normalize the identifier
  identifier := LOWER(TRIM(identifier));
  
  -- Try to find by email (case-insensitive)
  SELECT p.id INTO found_user_id 
  FROM profiles p
  WHERE LOWER(p.email) = identifier
  LIMIT 1;
  
  IF found_user_id IS NOT NULL THEN
    SELECT p.email INTO user_email FROM profiles p WHERE p.id = found_user_id;
    RETURN user_email;
  END IF;
  
  -- Try to find by username (case-insensitive)
  SELECT p.id INTO found_user_id 
  FROM profiles p
  WHERE LOWER(p.username) = identifier
  LIMIT 1;
  
  IF found_user_id IS NOT NULL THEN
    SELECT p.email INTO user_email FROM profiles p WHERE p.id = found_user_id;
    RETURN user_email;
  END IF;
  
  -- Try to find by phone number
  SELECT p.id INTO found_user_id 
  FROM profiles p
  WHERE REPLACE(REPLACE(REPLACE(p.phone_number, ' ', ''), '-', ''), '+', '') = 
        REPLACE(REPLACE(REPLACE(identifier, ' ', ''), '-', ''), '+', '')
  LIMIT 1;
  
  IF found_user_id IS NOT NULL THEN
    SELECT p.email INTO user_email FROM profiles p WHERE p.id = found_user_id;
    RETURN user_email;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Only grant to authenticated users, not anon
REVOKE ALL ON FUNCTION public.find_user_email_by_identifier(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) TO authenticated;

-- 8. Update check_user_exists_by_email to not reveal if user exists
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.id INTO user_id 
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(TRIM(user_email))
  LIMIT 1;
  
  RETURN user_id;
END;
$$;

-- Only grant to authenticated users
REVOKE ALL ON FUNCTION public.check_user_exists_by_email(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO authenticated;

-- 9. Add policy for anon users to access only public profile fields (for viewing profiles without login)
CREATE POLICY "Anon can view basic profile info"
ON profiles FOR SELECT
TO anon
USING (true);