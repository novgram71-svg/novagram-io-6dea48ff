-- Create table for note reactions
CREATE TABLE public.note_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.message_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);

-- Enable RLS
ALTER TABLE public.note_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view all reactions
CREATE POLICY "Anyone can view note reactions"
ON public.note_reactions
FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
ON public.note_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
ON public.note_reactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.note_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_note_reactions_note_id ON public.note_reactions(note_id);
CREATE INDEX idx_note_reactions_user_id ON public.note_reactions(user_id);