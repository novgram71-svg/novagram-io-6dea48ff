-- Fix security_questions: Create a view that hides answer_hash from users
-- Drop existing view if it exists
DROP VIEW IF EXISTS public.security_questions_safe;

-- Create a secure view that only shows question and lock status (NOT the answer_hash)
CREATE VIEW public.security_questions_safe
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    question,
    is_locked,
    locked_until,
    failed_attempts,
    created_at,
    updated_at
  FROM public.security_questions
  WHERE user_id = auth.uid();

-- Fix profiles_public view: Recreate without email and phone_number
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    username,
    avatar_url,
    bio,
    created_at,
    updated_at
    -- Explicitly EXCLUDE email and phone_number
  FROM public.profiles;

-- Ensure the base security_questions table doesn't expose answer_hash via RLS
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own security question" ON public.security_questions;
DROP POLICY IF EXISTS "Users can view own security question metadata" ON public.security_questions;

-- Create new policy that only allows viewing through the secure view
-- Block direct SELECT access to the security_questions table - use view instead
CREATE POLICY "Block direct SELECT - use security_questions_safe view"
  ON public.security_questions FOR SELECT
  USING (false);

-- Users can still insert and update their own security questions
DROP POLICY IF EXISTS "Users can insert own security question" ON public.security_questions;
CREATE POLICY "Users can insert own security question"
  ON public.security_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security question" ON public.security_questions;  
CREATE POLICY "Users can update own security question"
  ON public.security_questions FOR UPDATE
  USING (auth.uid() = user_id);

-- Also update the verify_security_answer function to be more secure
-- It already exists but let's ensure it uses proper hashing comparison
CREATE OR REPLACE FUNCTION public.verify_security_answer(p_user_id uuid, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer_hash text;
  v_is_locked boolean;
  v_locked_until timestamptz;
  v_failed_attempts int;
  v_is_correct boolean;
BEGIN
  -- Get the security question record (SECURITY DEFINER bypasses RLS)
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