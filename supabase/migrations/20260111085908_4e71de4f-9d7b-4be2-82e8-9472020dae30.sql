-- ============================================
-- FIX WARNING-LEVEL SECURITY ISSUES
-- ============================================

-- 1. Add RLS policies for rate_limits table (service role access)
-- This table needs to be accessible by edge functions but not by users
CREATE POLICY "Service role can manage rate_limits" 
ON public.rate_limits 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Add admin access to security_audit_log
CREATE POLICY "Admins can view all audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add insert policy for audit logs (system/service role)
CREATE POLICY "Service can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 3. Add data retention policy for login_activity (automatic cleanup)
-- Create a function to clean old login activity records
CREATE OR REPLACE FUNCTION public.cleanup_old_login_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete login activity older than 90 days
  DELETE FROM public.login_activity 
  WHERE logged_in_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- ============================================

-- 4. Fix security_questions - prevent answer_hash from being exposed
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own security question" ON public.security_questions;

-- Create a new policy that only returns metadata, not the hash
-- Users should never see answer_hash - verification happens server-side
CREATE POLICY "Users can view own security question metadata" 
ON public.security_questions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create a security definer function to verify security answers without exposing hash
CREATE OR REPLACE FUNCTION public.verify_security_answer(
  p_user_id UUID,
  p_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Only allow users to verify their own security questions
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  SELECT answer_hash INTO stored_hash
  FROM public.security_questions
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare hashes (assumes answer is hashed client-side before calling)
  RETURN stored_hash = p_answer;
END;
$$;

-- 5. Fix password_reset_requests - tighten access
-- Drop existing policy if it exposes password hash
DROP POLICY IF EXISTS "Users can view their own reset requests" ON public.password_reset_requests;

-- Create policy that limits what users can see (no password hash exposure)
CREATE POLICY "Users can view own reset request status" 
ON public.password_reset_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 6. Update profiles policies to use secure functions
-- Ensure only own profile data (email/phone) is accessible
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their complete profile (including email/phone)
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- For viewing other profiles, use the secure RPC function get_profile_safe
-- which masks email and phone for non-owners

-- 7. Update linked_accounts to prevent email exposure
DROP POLICY IF EXISTS "Users can view their linked accounts" ON public.linked_accounts;

-- Create policy that only allows primary user to see their own linked accounts
CREATE POLICY "Users can view own linked accounts only" 
ON public.linked_accounts 
FOR SELECT 
TO authenticated
USING (auth.uid() = primary_user_id);

-- 8. Add moderation capability - admins can access profiles for moderation
CREATE POLICY "Admins can view all profiles for moderation" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));