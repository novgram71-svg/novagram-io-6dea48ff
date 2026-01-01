-- Story replies table
CREATE TABLE public.story_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Story owner can see all replies to their stories
CREATE POLICY "Story owners can view replies" ON public.story_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_replies.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Senders can see their own replies
CREATE POLICY "Senders can view own replies" ON public.story_replies
  FOR SELECT USING (sender_id = auth.uid());

-- Authenticated users can send replies
CREATE POLICY "Users can send story replies" ON public.story_replies
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Senders can delete their own replies
CREATE POLICY "Senders can delete own replies" ON public.story_replies
  FOR DELETE USING (sender_id = auth.uid());

-- Story likes table
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see story likes
CREATE POLICY "Anyone can view story likes" ON public.story_likes
  FOR SELECT USING (true);

-- Authenticated users can like stories
CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can unlike stories
CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE USING (user_id = auth.uid());

-- Push notification tokens table
CREATE TABLE public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can view own tokens" ON public.push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" ON public.push_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens" ON public.push_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for story_replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;