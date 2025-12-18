import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PostWithUser {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

export const usePosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostWithUser[];
    },
  });
};

export const useUserPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostWithUser[];
    },
    enabled: !!userId,
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked, postOwnerId }: { postId: string; isLiked: boolean; postOwnerId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;

        // Create notification for post owner
        if (postOwnerId && postOwnerId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: postOwnerId,
            actor_id: user.id,
            type: 'like',
            post_id: postId,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ imageUrl, caption }: { imageUrl: string; caption: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
