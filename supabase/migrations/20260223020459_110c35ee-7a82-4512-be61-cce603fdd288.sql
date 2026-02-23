
-- Fix: Posts from private accounts should not be publicly visible
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- Create a privacy-aware SELECT policy
CREATE POLICY "Posts visible based on privacy settings"
ON posts FOR SELECT
USING (
  auth.uid() = user_id
  OR NOT is_private_account(user_id)
  OR EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() 
    AND following_id = posts.user_id
  )
  OR has_role(auth.uid(), 'admin')
);
