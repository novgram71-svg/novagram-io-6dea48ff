-- Fix the overly permissive INSERT policy on security_audit_log
-- INSERT policies only allow WITH CHECK, not USING

-- Create a more restrictive policy for service role inserts
CREATE POLICY "Service role can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert their own audit logs
CREATE POLICY "Authenticated users can insert own audit logs" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);