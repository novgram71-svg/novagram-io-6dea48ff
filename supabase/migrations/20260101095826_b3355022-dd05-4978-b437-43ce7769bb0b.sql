-- Allow anyone to view just the private_account status (for checking if profile is private)
CREATE POLICY "Anyone can view private_account status"
ON public.user_settings
FOR SELECT
USING (true);

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;