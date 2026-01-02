-- Create voice_messages storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice_messages', 'voice_messages', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload voice messages
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice_messages' AND
  auth.uid() IS NOT NULL
);

-- Allow anyone to view voice messages (they're in chats)
CREATE POLICY "Anyone can view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice_messages');

-- Allow users to delete their own voice messages
CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice_messages' AND
  auth.uid()::text = (storage.foldername(name))[1]
);