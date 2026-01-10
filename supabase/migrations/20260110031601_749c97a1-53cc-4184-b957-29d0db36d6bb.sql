-- Fix the security definer view issue by dropping the view
-- and using a function-based approach instead (which is already in place)
DROP VIEW IF EXISTS public.public_profiles;