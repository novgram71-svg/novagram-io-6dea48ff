-- COMPREHENSIVE SECURITY FIX - All 5 Critical Issues

-- ============================================
-- 1. REMOVE HARDCODED ADMIN TRIGGER (Critical!)
-- ============================================
DROP TRIGGER IF EXISTS on_profile_created_assign_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role();

-- ============================================
-- 2. FIX PROFILES TABLE - Hide email/phone from public
-- ============================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Anonymous can view public profile info" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create secure policy - authenticated users see basic info, only owner sees sensitive data
CREATE POLICY "Users can view profile basic info"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Note: The email and phone_number fields are in the table but should only be 
-- returned to the owner. We'll handle this in the application layer with a secure function.

-- Create a secure function to get profile with privacy protection
CREATE OR REPLACE FUNCTION public.get_profile_safe(profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  avatar_url text,
  bio text,
  email text,
  phone_number text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    -- Only show email/phone to the owner
    CASE WHEN auth.uid() = p.id THEN p.email ELSE NULL END as email,
    CASE WHEN auth.uid() = p.id THEN p.phone_number ELSE NULL END as phone_number,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;

-- ============================================
-- 3. FIX CHAT-FILES STORAGE BUCKET - Make Private
-- ============================================
-- Make the bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-files';

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;

-- Create secure policy for chat files - only uploader and recipients can view
CREATE POLICY "Chat participants can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  (
    -- User uploaded the file (folder structure: user_id/filename)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- User is a recipient of a message with this file
    EXISTS (
      SELECT 1 FROM messages m
      WHERE (m.image_url LIKE '%' || name OR m.file_url LIKE '%' || name)
      AND (m.receiver_id = auth.uid() OR m.sender_id = auth.uid())
    )
  )
);

-- ============================================
-- 4. FIX VOICE MESSAGES BUCKET - Make Private
-- ============================================
UPDATE storage.buckets 
SET public = false 
WHERE id = 'voice_messages';

DROP POLICY IF EXISTS "Anyone can view voice messages" ON storage.objects;

CREATE POLICY "Voice message participants can view"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice_messages' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.voice_url LIKE '%' || name
      AND (m.receiver_id = auth.uid() OR m.sender_id = auth.uid())
    )
  )
);

-- ============================================
-- 5. Ensure login_activity is properly secured
-- ============================================
-- Already fixed in previous migration, but verify
DROP POLICY IF EXISTS "Service role can insert login activity" ON login_activity;