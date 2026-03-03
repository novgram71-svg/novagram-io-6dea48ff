
-- 1. Add is_pinned column to posts table
ALTER TABLE public.posts ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- 2. Allow post owners to update their own posts (for pinning)
CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create muted_users table
CREATE TABLE public.muted_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, muted_id)
);

ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mutes"
ON public.muted_users FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can mute others"
ON public.muted_users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmute others"
ON public.muted_users FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. Create reposts table
CREATE TABLE public.reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reposts are viewable by everyone"
ON public.reposts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create reposts"
ON public.reposts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reposts"
ON public.reposts FOR DELETE TO authenticated
USING (auth.uid() = user_id);
