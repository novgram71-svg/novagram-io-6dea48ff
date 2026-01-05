-- Create user_referrals table to track referral relationships
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create user_verification table to track verification points
CREATE TABLE public.user_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their own referrals"
ON public.user_referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
ON public.user_referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- RLS Policies for user_verification
CREATE POLICY "Users can view their own verification status"
ON public.user_verification FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view if a user is verified"
ON public.user_verification FOR SELECT
USING (true);

CREATE POLICY "System can insert verification records"
ON public.user_verification FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update verification records"
ON public.user_verification FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'NOVA' || UPPER(SUBSTRING(MD5(user_id::text || now()::text) FROM 1 FOR 8));
  RETURN code;
END;
$$;

-- Create function to initialize verification for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_verification (user_id, referral_code, points)
  VALUES (NEW.id, generate_referral_code(NEW.id), 0);
  RETURN NEW;
END;
$$;

-- Trigger to create verification record when a profile is created
CREATE TRIGGER on_profile_created_verification
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_verification();

-- Create function to process referral and award points
CREATE OR REPLACE FUNCTION public.process_referral(referral_code_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  current_user_id UUID;
  referrer_points INTEGER;
  referred_points INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  -- Find the referrer by code
  SELECT user_id INTO referrer_user_id
  FROM user_verification
  WHERE referral_code = referral_code_input;
  
  IF referrer_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  IF referrer_user_id = current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM user_referrals WHERE referred_id = current_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;
  
  -- Create the referral relationship
  INSERT INTO user_referrals (referrer_id, referred_id)
  VALUES (referrer_user_id, current_user_id);
  
  -- Award 5 points to the referrer
  UPDATE user_verification
  SET points = LEAST(points + 5, 20),
      is_verified = CASE WHEN points + 5 >= 20 THEN true ELSE is_verified END,
      updated_at = now()
  WHERE user_id = referrer_user_id
  RETURNING points INTO referrer_points;
  
  -- Award 3 points to the referred user
  UPDATE user_verification
  SET points = LEAST(points + 3, 20),
      is_verified = CASE WHEN points + 3 >= 20 THEN true ELSE is_verified END,
      updated_at = now()
  WHERE user_id = current_user_id
  RETURNING points INTO referred_points;
  
  RETURN json_build_object(
    'success', true, 
    'referrer_points', referrer_points,
    'your_points', referred_points
  );
END;
$$;

-- Enable realtime for verification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_verification;