-- Create saved_posts table for saved posts feature
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on saved_posts
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved posts
CREATE POLICY "Users can view their own saved posts" ON public.saved_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can save posts
CREATE POLICY "Users can save posts" ON public.saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unsave posts  
CREATE POLICY "Users can unsave posts" ON public.saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create login_activity table for tracking login sessions
CREATE TABLE public.login_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  location TEXT,
  logged_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

-- Enable RLS on login_activity
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own login activity
CREATE POLICY "Users can view their own login activity" ON public.login_activity
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert login activity (via edge function)
CREATE POLICY "Service role can insert login activity" ON public.login_activity
  FOR INSERT WITH CHECK (true);

-- Create ai_abuse_reports table for AI moderation
CREATE TABLE public.ai_abuse_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  detected_issues TEXT[],
  severity TEXT DEFAULT 'low',
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_abuse_reports
ALTER TABLE public.ai_abuse_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can view abuse reports (using service role for edge function)
CREATE POLICY "Service role can manage abuse reports" ON public.ai_abuse_reports
  FOR ALL USING (true);