-- Fix the find_user_email_by_identifier function to work for unauthenticated users during login
-- This is needed because the function is called BEFORE the user logs in
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
  -- NOTE: This function MUST work without authentication as it's used during login
  -- to look up the user's email by username/phone before they've signed in
  -- Security is maintained by:
  -- 1. Only returning the email (not exposing other profile data)
  -- 2. Being used only for the login flow
  -- 3. SECURITY DEFINER ensures it runs with elevated privileges safely
  
  -- Normalize the identifier
  identifier := LOWER(TRIM(identifier));
  
  -- Sanitize input to prevent injection
  IF identifier IS NULL OR LENGTH(identifier) < 3 OR LENGTH(identifier) > 255 THEN
    RETURN NULL;
  END IF;
  
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

-- Grant execute to anon role so unauthenticated users can use it during login
GRANT EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) TO authenticated;