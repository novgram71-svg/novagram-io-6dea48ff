-- Create user_presence table for tracking online status
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view presence
CREATE POLICY "Anyone can view presence" 
ON public.user_presence 
FOR SELECT 
USING (true);

-- Users can update their own presence
CREATE POLICY "Users can update own presence" 
ON public.user_presence 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence" 
ON public.user_presence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Add read_at column to messages table for read receipts
ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;