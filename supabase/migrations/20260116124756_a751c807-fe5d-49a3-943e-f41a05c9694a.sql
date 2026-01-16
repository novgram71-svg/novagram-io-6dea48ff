-- Fix check_user_exists_by_email to work without authentication for password reset flow
-- This function is used to find a user by email to send them a reset code
-- Security is maintained by only returning the user ID (not exposing other data)
-- and by rate limiting the password reset endpoint

CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(user_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  found_user_id uuid;
BEGIN
  -- Sanitize and validate input
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) < 5 OR LENGTH(user_email) > 255 THEN
    RETURN NULL;
  END IF;
  
  -- Find user by email (case-insensitive)
  SELECT p.id INTO found_user_id 
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(TRIM(user_email))
  LIMIT 1;
  
  RETURN found_user_id;
END;
$function$;

-- Grant execute permission to anon role so unauthenticated users can use it for password reset
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO authenticated;