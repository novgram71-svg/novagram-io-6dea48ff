
CREATE OR REPLACE FUNCTION public.admin_revoke_badge(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can revoke badges');
  END IF;
  
  -- Revoke the badge
  UPDATE public.user_verification 
  SET 
    is_verified = false,
    admin_granted = false,
    pending_badge = false,
    verified_until = NULL,
    badge_granted_by = NULL,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN json_build_object('success', true);
END;
$$;
