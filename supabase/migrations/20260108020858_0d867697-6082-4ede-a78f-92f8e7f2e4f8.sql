-- Fix the security definer view issue by dropping it and using a regular view with invoker security
DROP VIEW IF EXISTS public.public_profiles;

-- Create a regular view without security definer (uses invoker's permissions)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  created_at
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;