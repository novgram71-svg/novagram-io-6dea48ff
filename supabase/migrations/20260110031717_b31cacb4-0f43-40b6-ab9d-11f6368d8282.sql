-- =============================================
-- SECURITY FIX: Hide email/phone from profiles table
-- RLS cannot mask columns, so we need to use a different approach
-- =============================================

-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view public profile fields" ON profiles;
DROP POLICY IF EXISTS "Anon can view basic profile info" ON profiles;

-- Create a policy that only allows users to see their OWN profile with all fields
-- Other users' profiles should be accessed through the secure function
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy for anon users (they can't see any profiles directly)
-- They should use the public function instead
CREATE POLICY "Anon cannot view profiles directly"
ON profiles FOR SELECT
TO anon
USING (false);

-- Now update the get_profile_safe function to work for viewing ANY profile
-- but mask sensitive fields for non-owners
CREATE OR REPLACE FUNCTION public.get_profile_safe(profile_id uuid)
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
  WHERE p.id = profile_id;
END;
$$;

-- Grant execute to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_profile_safe(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_safe(uuid) TO authenticated;

-- Create a function to search profiles safely (for search functionality)
CREATE OR REPLACE FUNCTION public.search_profiles_safe(search_query text, result_limit int DEFAULT 20)
RETURNS TABLE(
  id uuid, 
  username text, 
  avatar_url text, 
  bio text
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
    p.bio
  FROM profiles p
  WHERE p.username ILIKE '%' || search_query || '%'
  ORDER BY p.username
  LIMIT result_limit;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.search_profiles_safe(text, int) TO authenticated;

-- Create a function to get all profiles safely (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_profiles_safe()
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
  -- Only admins can see all profiles with email/phone
  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.bio,
      p.email,
      p.phone_number,
      p.created_at,
      p.updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
  ELSE
    -- Non-admins get masked data
    RETURN QUERY
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.bio,
      NULL::text as email,
      NULL::text as phone_number,
      p.created_at,
      p.updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_profiles_safe() TO authenticated;

-- Create a function to get profiles by IDs (for batch fetching)
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(user_ids uuid[])
RETURNS TABLE(
  id uuid, 
  username text, 
  avatar_url text, 
  bio text
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
    p.bio
  FROM profiles p
  WHERE p.id = ANY(user_ids);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profiles_by_ids(uuid[]) TO authenticated;