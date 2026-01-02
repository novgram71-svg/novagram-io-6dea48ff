-- Add voice_url and reply_to_id columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS voice_url TEXT,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);

-- Create linked_accounts table for account switching
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL,
  linked_user_id UUID NOT NULL,
  linked_email TEXT NOT NULL,
  linked_username TEXT NOT NULL,
  linked_avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(primary_user_id, linked_user_id)
);

-- Enable RLS
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for linked accounts
CREATE POLICY "Users can view their own linked accounts"
ON public.linked_accounts FOR SELECT
USING (auth.uid() = primary_user_id);

CREATE POLICY "Users can insert their own linked accounts"
ON public.linked_accounts FOR INSERT
WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Users can delete their own linked accounts"
ON public.linked_accounts FOR DELETE
USING (auth.uid() = primary_user_id);