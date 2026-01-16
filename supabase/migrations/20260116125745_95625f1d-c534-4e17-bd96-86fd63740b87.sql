-- Fix Security Definer View warnings by using SECURITY INVOKER views instead

-- Drop and recreate profiles_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  created_at,
  updated_at,
  -- Only show email/phone to the profile owner
  CASE WHEN auth.uid() = id THEN email ELSE NULL END as email,
  CASE WHEN auth.uid() = id THEN phone_number ELSE NULL END as phone_number
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Drop and recreate user_verification_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_verification_public;

CREATE VIEW public.user_verification_public 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  is_verified,
  verified_until,
  -- Only show referral code to the owner
  CASE WHEN auth.uid() = user_id THEN referral_code ELSE NULL END as referral_code,
  CASE WHEN auth.uid() = user_id THEN points ELSE NULL END as points
FROM public.user_verification;

GRANT SELECT ON public.user_verification_public TO anon, authenticated;