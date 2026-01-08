-- Create a function to check if user can view settings (for the UI)
CREATE OR REPLACE FUNCTION public.get_user_private_status(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT private_account FROM user_settings WHERE user_id = target_user_id),
    false
  )
$$;

-- Create a function to get public presence data respecting activity_status
CREATE OR REPLACE FUNCTION public.get_user_presence(target_user_id uuid)
RETURNS TABLE(is_online boolean, last_seen timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_enabled boolean;
BEGIN
  -- Check if user has activity status enabled
  SELECT COALESCE(us.activity_status, true) INTO activity_enabled
  FROM user_settings us
  WHERE us.user_id = target_user_id;
  
  -- If activity is disabled, return null/false
  IF NOT COALESCE(activity_enabled, true) THEN
    RETURN QUERY SELECT false::boolean, NULL::timestamptz;
    RETURN;
  END IF;
  
  -- Return presence data
  RETURN QUERY
  SELECT up.is_online, up.last_seen
  FROM user_presence up
  WHERE up.user_id = target_user_id;
END;
$$;

-- Update user_settings to allow reading own settings + checking private status via function
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;

CREATE POLICY "Users can view settings"
ON user_settings FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id -- Own settings
);