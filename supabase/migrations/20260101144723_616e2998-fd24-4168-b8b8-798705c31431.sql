-- Add foreign key from password_reset_requests to profiles
ALTER TABLE public.password_reset_requests
ADD CONSTRAINT password_reset_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Create message_notes table for Instagram-like notes feature
CREATE TABLE public.message_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_notes ENABLE ROW LEVEL SECURITY;

-- Policies for message_notes
CREATE POLICY "Users can view notes from users they follow or their own"
ON public.message_notes
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() AND following_id = user_id
  )
);

CREATE POLICY "Users can create their own notes"
ON public.message_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.message_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for expiration queries
CREATE INDEX idx_message_notes_expires_at ON public.message_notes(expires_at);
CREATE INDEX idx_message_notes_user_id ON public.message_notes(user_id);