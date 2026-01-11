-- Add database-level validation for comments content
-- First update any existing overly long comments
UPDATE public.comments
SET content = substring(content, 1, 1000)
WHERE length(content) > 1000;

-- Add CHECK constraint for comment content length (matches Zod schema)
ALTER TABLE public.comments
ADD CONSTRAINT comment_content_length 
CHECK (length(content) >= 1 AND length(content) <= 1000);

-- Add constraint to prevent empty/whitespace-only comments
ALTER TABLE public.comments
ADD CONSTRAINT comment_content_not_empty
CHECK (length(TRIM(content)) > 0);

-- Update the comments INSERT policy to include rate limiting
DROP POLICY IF EXISTS "Users can create comments if not blocked" ON public.comments;

CREATE POLICY "Users can create comments with limits"
ON public.comments 
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND length(content) >= 1 
  AND length(content) <= 1000
  AND length(TRIM(content)) > 0
  -- Rate limit: max 30 comments per minute
  AND (
    SELECT COUNT(*) FROM public.comments 
    WHERE user_id = auth.uid() 
    AND created_at > now() - interval '1 minute'
  ) < 30
  -- Block check
  AND NOT EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.blocked_users bu ON bu.blocker_id = p.user_id
    WHERE p.id = post_id
    AND bu.blocked_id = auth.uid()
  )
);