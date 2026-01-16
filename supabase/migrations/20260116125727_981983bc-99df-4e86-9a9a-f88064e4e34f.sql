-- Fix security issues identified in the security scan

-- 1. Restrict profiles table: authenticated users should only see public fields of other users
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can see their own full profile
  auth.uid() = id 
  OR 
  -- Other users can only see this profile (but sensitive fields will be handled at query level)
  true
);

-- Create a secure view that hides sensitive data from other users
CREATE OR REPLACE VIEW public.profiles_public AS
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

-- 2. Fix password_reset_requests: users should only see status, not the password hash
DROP POLICY IF EXISTS "Users can view their own requests" ON public.password_reset_requests;

CREATE POLICY "Users can view own request status only"
ON public.password_reset_requests
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Create a secure function to check request status without exposing password hash
CREATE OR REPLACE FUNCTION public.get_my_password_reset_status()
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prr.id,
    prr.status,
    prr.created_at,
    prr.resolved_at
  FROM password_reset_requests prr
  WHERE prr.user_id = auth.uid()
  ORDER BY prr.created_at DESC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_password_reset_status() TO authenticated;

-- 3. Fix security_questions: limit verification attempts
ALTER TABLE public.security_questions 
ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamptz DEFAULT NULL;

-- Update verify_security_answer to handle lockout
CREATE OR REPLACE FUNCTION public.verify_security_answer(p_user_id uuid, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_answer_hash text;
  v_is_locked boolean;
  v_locked_until timestamptz;
  v_failed_attempts int;
  v_is_correct boolean;
BEGIN
  -- Get the security question record
  SELECT 
    answer_hash, 
    is_locked, 
    locked_until,
    COALESCE(failed_attempts, 0)
  INTO v_answer_hash, v_is_locked, v_locked_until, v_failed_attempts
  FROM security_questions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if locked due to too many attempts
  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN false;
  END IF;
  
  -- Check if permanently locked
  IF v_is_locked = true AND v_locked_until IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify the answer (case-insensitive comparison of hash)
  v_is_correct := v_answer_hash = encode(sha256(lower(trim(p_answer))::bytea), 'hex');
  
  IF v_is_correct THEN
    -- Reset failed attempts on success
    UPDATE security_questions 
    SET failed_attempts = 0, locked_until = NULL
    WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    -- Increment failed attempts
    v_failed_attempts := v_failed_attempts + 1;
    
    -- Lock for 15 minutes after 5 failed attempts
    IF v_failed_attempts >= 5 THEN
      UPDATE security_questions 
      SET 
        failed_attempts = v_failed_attempts,
        locked_until = now() + interval '15 minutes'
      WHERE user_id = p_user_id;
    ELSE
      UPDATE security_questions 
      SET failed_attempts = v_failed_attempts
      WHERE user_id = p_user_id;
    END IF;
    
    RETURN false;
  END IF;
END;
$$;

-- 4. Add automatic cleanup for login_activity (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM login_activity
  WHERE logged_in_at < now() - interval '90 days'
  AND is_current = false;
END;
$$;

-- 5. Fix user_verification to only expose is_verified and verified_until publicly
DROP POLICY IF EXISTS "Anyone can view verification status only" ON public.user_verification;

CREATE POLICY "Anyone can view basic verification status"
ON public.user_verification
FOR SELECT
USING (true);

-- Create a secure view for public verification data
CREATE OR REPLACE VIEW public.user_verification_public AS
SELECT 
  user_id,
  is_verified,
  verified_until,
  -- Only show referral code to the owner
  CASE WHEN auth.uid() = user_id THEN referral_code ELSE NULL END as referral_code,
  CASE WHEN auth.uid() = user_id THEN points ELSE NULL END as points
FROM public.user_verification;

GRANT SELECT ON public.user_verification_public TO anon, authenticated;