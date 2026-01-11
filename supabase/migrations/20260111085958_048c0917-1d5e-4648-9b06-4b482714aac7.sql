-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can insert audit logs" ON public.security_audit_log;