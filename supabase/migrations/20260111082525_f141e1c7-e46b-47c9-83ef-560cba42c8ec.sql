-- Fix linked_accounts table RLS to strictly prevent unauthorized access
-- Drop existing policies and create secure ones
DROP POLICY IF EXISTS "Users can view their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can insert their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can delete their own linked accounts" ON public.linked_accounts;

-- Create strict RLS policies for linked_accounts
-- Users can ONLY view their own linked accounts
CREATE POLICY "linked_accounts_select_own"
ON public.linked_accounts
FOR SELECT
USING (auth.uid() = primary_user_id);

-- Users can ONLY insert their own linked accounts
CREATE POLICY "linked_accounts_insert_own"
ON public.linked_accounts
FOR INSERT
WITH CHECK (auth.uid() = primary_user_id);

-- Users can ONLY update their own linked accounts
CREATE POLICY "linked_accounts_update_own"
ON public.linked_accounts
FOR UPDATE
USING (auth.uid() = primary_user_id)
WITH CHECK (auth.uid() = primary_user_id);

-- Users can ONLY delete their own linked accounts
CREATE POLICY "linked_accounts_delete_own"
ON public.linked_accounts
FOR DELETE
USING (auth.uid() = primary_user_id);

-- Create a rate limiting table for tracking API requests
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limits (only accessible via service role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access
-- This prevents users from manipulating their own rate limits

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, endpoint, window_start);

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Remove the password hash column from password_reset_requests table
-- Since we now use direct password updates, we don't need to store hashes
-- First check if the column exists, then handle it
-- Note: We keep the column for backwards compatibility but will migrate away

-- Add a security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security_audit_log (only accessible via service role for writes)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "security_audit_log_select_own"
ON public.security_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user 
ON public.security_audit_log(user_id, created_at DESC);