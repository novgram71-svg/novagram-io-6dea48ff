
-- Create table to store AI-collected user profile data
CREATE TABLE IF NOT EXISTS public.ai_user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  age TEXT,
  location TEXT,
  interests TEXT[],
  occupation TEXT,
  personality_notes TEXT,
  conversation_summary TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile data
CREATE POLICY "Users can view their own AI profile"
ON public.ai_user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI profile"
ON public.ai_user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI profile"
ON public.ai_user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all AI profiles via service role (edge function)
-- The edge function uses service role key, so it bypasses RLS
