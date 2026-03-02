
-- 1. Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles for moderation" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Create strict owner-only SELECT policy
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 3. Admins can still view all profiles via has_role
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. Create secure email existence check function (no data leaked)
CREATE OR REPLACE FUNCTION public.check_email_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) < 5 OR LENGTH(user_email) > 255 THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = LOWER(TRIM(user_email)));
END;
$$;

-- 5. Create secure function to get own profile for account linking
CREATE OR REPLACE FUNCTION public.get_own_profile_for_linking()
RETURNS TABLE(username text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.username, p.avatar_url
  FROM profiles p
  WHERE p.id = auth.uid();
END;
$$;
