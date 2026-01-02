-- Create chat_themes table to store conversation theme preferences
CREATE TABLE public.chat_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.chat_themes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat themes" 
ON public.chat_themes 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can insert their own chat themes" 
ON public.chat_themes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat themes" 
ON public.chat_themes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_chat_themes_updated_at
  BEFORE UPDATE ON public.chat_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add story_mentions table
CREATE TABLE public.story_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position_x DECIMAL NOT NULL DEFAULT 50,
  position_y DECIMAL NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.story_mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for story mentions
CREATE POLICY "Anyone can view story mentions" 
ON public.story_mentions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create mentions on their stories" 
ON public.story_mentions 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.stories WHERE id = story_id
  )
);

CREATE POLICY "Story owners can delete mentions" 
ON public.story_mentions 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.stories WHERE id = story_id
  )
);

-- Add shared_post_id to messages table for post sharing
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;