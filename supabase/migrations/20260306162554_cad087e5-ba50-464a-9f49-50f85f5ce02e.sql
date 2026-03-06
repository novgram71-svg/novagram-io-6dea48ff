
CREATE TABLE public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL DEFAULT 'male',
  hair_style TEXT NOT NULL DEFAULT 'short',
  hair_color TEXT NOT NULL DEFAULT 'black',
  skin_tone TEXT NOT NULL DEFAULT 'medium',
  outfit TEXT NOT NULL DEFAULT 'casual',
  accessories TEXT NOT NULL DEFAULT 'none',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any avatar" ON public.user_avatars FOR SELECT USING (true);
CREATE POLICY "Users can insert own avatar" ON public.user_avatars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own avatar" ON public.user_avatars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own avatar" ON public.user_avatars FOR DELETE USING (auth.uid() = user_id);
