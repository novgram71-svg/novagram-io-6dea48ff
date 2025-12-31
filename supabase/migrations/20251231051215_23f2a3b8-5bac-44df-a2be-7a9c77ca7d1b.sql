-- Security questions table
CREATE TABLE public.security_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  question TEXT NOT NULL DEFAULT 'What is your father''s phone number?',
  answer_hash TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

-- Users can only view and create their own security question
CREATE POLICY "Users can view their own security question" ON public.security_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security question" ON public.security_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked security question" ON public.security_questions
  FOR UPDATE USING (auth.uid() = user_id AND is_locked = false);

-- Password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  new_password_hash TEXT NOT NULL,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own password reset requests" ON public.password_reset_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own password reset requests" ON public.password_reset_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all password reset requests" ON public.password_reset_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update password reset requests" ON public.password_reset_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Follow requests table for private accounts
CREATE TABLE public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- Enable RLS
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their own follow requests" ON public.follow_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Users can create follow requests
CREATE POLICY "Users can create follow requests" ON public.follow_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Target users can update (approve/reject) requests
CREATE POLICY "Target users can update follow requests" ON public.follow_requests
  FOR UPDATE USING (auth.uid() = target_id);

-- Requesters can delete their pending requests
CREATE POLICY "Requesters can delete pending requests" ON public.follow_requests
  FOR DELETE USING (auth.uid() = requester_id AND status = 'pending');

-- Add phone_number to profiles
ALTER TABLE public.profiles ADD COLUMN phone_number TEXT UNIQUE;

-- Create hashtags table
CREATE TABLE public.hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Everyone can view hashtags
CREATE POLICY "Anyone can view hashtags" ON public.hashtags
  FOR SELECT USING (true);

-- Post hashtags junction table
CREATE TABLE public.post_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Enable RLS
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- Everyone can view post hashtags
CREATE POLICY "Anyone can view post hashtags" ON public.post_hashtags
  FOR SELECT USING (true);

-- Users can add hashtags to their posts
CREATE POLICY "Users can add hashtags to posts" ON public.post_hashtags
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()));

-- Add trigger for updated_at on security_questions
CREATE TRIGGER update_security_questions_updated_at
  BEFORE UPDATE ON public.security_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();