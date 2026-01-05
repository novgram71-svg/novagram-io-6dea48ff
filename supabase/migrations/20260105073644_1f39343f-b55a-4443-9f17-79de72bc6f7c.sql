-- Add verified_until column to track when verification expires (2 months)
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS verified_until timestamp with time zone;

-- Add was_referred column to track if user signed up with a referral code
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS was_referred boolean DEFAULT false;

-- Add admin_granted column to track if badge was given by admin
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS admin_granted boolean DEFAULT false;

-- Add pending_badge column to track if user has pending badge to accept
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS pending_badge boolean DEFAULT false;

-- Add badge_granted_by column to track which admin granted the badge
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS badge_granted_by uuid REFERENCES auth.users(id);

-- Create function to grant badge by admin
CREATE OR REPLACE FUNCTION public.admin_grant_badge(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can grant badges');
  END IF;
  
  -- Update or insert verification record with pending badge
  INSERT INTO public.user_verification (user_id, referral_code, pending_badge, badge_granted_by)
  VALUES (
    target_user_id, 
    'NOVA' || upper(substring(md5(random()::text) from 1 for 8)),
    true,
    auth.uid()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    pending_badge = true,
    badge_granted_by = auth.uid(),
    updated_at = now();
  
  -- Create notification for the user
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (target_user_id, auth.uid(), 'verification_gift');
  
  RETURN json_build_object('success', true);
END;
$$;

-- Create function to accept badge
CREATE OR REPLACE FUNCTION public.accept_badge()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user has pending badge
  IF NOT EXISTS (SELECT 1 FROM user_verification WHERE user_id = auth.uid() AND pending_badge = true) THEN
    RETURN json_build_object('success', false, 'error', 'No pending badge to accept');
  END IF;
  
  -- Accept the badge and set expiration to 2 months
  UPDATE public.user_verification 
  SET 
    pending_badge = false,
    is_verified = true,
    admin_granted = true,
    verified_until = now() + interval '2 months',
    updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN json_build_object('success', true, 'verified_until', (now() + interval '2 months')::text);
END;
$$;

-- Update process_referral to mark was_referred
CREATE OR REPLACE FUNCTION public.process_referral(referral_code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id uuid;
  current_user_id uuid;
  referrer_points int;
  your_points int;
  referrer_current_points int;
  your_current_points int;
  referrer_is_verified boolean;
  your_is_verified boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user has already been referred
  IF EXISTS (SELECT 1 FROM user_referrals WHERE referred_id = current_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;
  
  -- Check if user was referred (signed up via referral link)
  IF EXISTS (SELECT 1 FROM user_verification WHERE user_id = current_user_id AND was_referred = true) THEN
    RETURN json_build_object('success', false, 'error', 'You already signed up with a referral link');
  END IF;
  
  -- Find referrer by code
  SELECT user_id INTO referrer_user_id
  FROM user_verification
  WHERE referral_code = referral_code_input;
  
  IF referrer_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Can't refer yourself
  IF referrer_user_id = current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot use your own referral code');
  END IF;
  
  -- Create referral record
  INSERT INTO user_referrals (referrer_id, referred_id)
  VALUES (referrer_user_id, current_user_id);
  
  -- Update referrer points (+5)
  UPDATE user_verification 
  SET points = points + 5, updated_at = now()
  WHERE user_id = referrer_user_id
  RETURNING points, is_verified INTO referrer_current_points, referrer_is_verified;
  
  -- Check if referrer should be verified (20 points)
  IF referrer_current_points >= 20 AND NOT referrer_is_verified THEN
    UPDATE user_verification 
    SET is_verified = true, verified_until = now() + interval '2 months', updated_at = now()
    WHERE user_id = referrer_user_id;
  END IF;
  
  -- Update referred user points (+3) and mark as referred
  UPDATE user_verification 
  SET points = points + 3, was_referred = true, updated_at = now()
  WHERE user_id = current_user_id
  RETURNING points, is_verified INTO your_current_points, your_is_verified;
  
  -- Check if referred user should be verified
  IF your_current_points >= 20 AND NOT your_is_verified THEN
    UPDATE user_verification 
    SET is_verified = true, verified_until = now() + interval '2 months', updated_at = now()
    WHERE user_id = current_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'referrer_points', referrer_current_points,
    'your_points', your_current_points
  );
END;
$$;

-- Create function to check and expire badges
CREATE OR REPLACE FUNCTION public.check_badge_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expire badges that have passed their verified_until date
  UPDATE public.user_verification 
  SET is_verified = false, admin_granted = false, updated_at = now()
  WHERE is_verified = true 
    AND verified_until IS NOT NULL 
    AND verified_until < now();
END;
$$;