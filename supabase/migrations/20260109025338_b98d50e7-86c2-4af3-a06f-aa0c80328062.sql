-- Create a secure function to find user email by identifier for login purposes
-- This function only returns email if the identifier matches, without exposing all data
CREATE OR REPLACE FUNCTION public.find_user_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Normalize the identifier
  identifier := LOWER(TRIM(identifier));
  
  -- Try to find by email (case-insensitive)
  SELECT email INTO user_email 
  FROM profiles 
  WHERE LOWER(email) = identifier
  LIMIT 1;
  
  IF user_email IS NOT NULL THEN
    RETURN user_email;
  END IF;
  
  -- Try to find by username (case-insensitive)
  SELECT email INTO user_email 
  FROM profiles 
  WHERE LOWER(username) = identifier
  LIMIT 1;
  
  IF user_email IS NOT NULL THEN
    RETURN user_email;
  END IF;
  
  -- Try to find by phone number (exact match, removing common formatting)
  SELECT email INTO user_email 
  FROM profiles 
  WHERE REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = 
        REPLACE(REPLACE(REPLACE(identifier, ' ', ''), '-', ''), '+', '')
  LIMIT 1;
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.find_user_email_by_identifier(text) TO authenticated;

-- Create a secure function to check if a user exists by email for password reset
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id 
  FROM profiles 
  WHERE LOWER(email) = LOWER(TRIM(user_email))
  LIMIT 1;
  
  RETURN user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO authenticated;