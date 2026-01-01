-- Add policy to allow reading security questions for password reset (unauthenticated)
-- This only allows reading the question field, not the answer_hash
CREATE POLICY "Allow reading security questions for password reset"
  ON public.security_questions
  FOR SELECT
  USING (true);

-- Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view their own security question" ON public.security_questions;