-- Add edited_at and image_url/file_url columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for message_reactions
CREATE POLICY "Users can view reactions on their messages"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy to messages table for sender
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files
CREATE POLICY "Anyone can view chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can upload chat files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their chat files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);