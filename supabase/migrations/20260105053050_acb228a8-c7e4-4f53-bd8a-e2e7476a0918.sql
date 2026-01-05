-- Fix function search path for generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'NOVA' || UPPER(SUBSTRING(MD5(user_id::text || now()::text) FROM 1 FOR 8));
  RETURN code;
END;
$$;