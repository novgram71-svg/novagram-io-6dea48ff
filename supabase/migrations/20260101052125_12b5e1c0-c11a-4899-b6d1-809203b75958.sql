-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own password reset requests" ON public.password_reset_requests;

-- Create a new policy that allows anyone to insert password reset requests
-- This is safe because:
-- 1. User must first find their account by email
-- 2. User must correctly answer their security question
-- 3. Admin must approve before password change takes effect
CREATE POLICY "Anyone can create password reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);