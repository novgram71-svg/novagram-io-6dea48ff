import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useIsReposted = (postId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-reposted', user?.id, postId],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!postId,
  });
};

export const useRepostCount = (postId: string) => {
  return useQuery({
    queryKey: ['repost-count', postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reposts')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!postId,
  });
};

export const useToggleRepost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isReposted, postOwnerId }: { postId: string; isReposted: boolean; postOwnerId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      if (isReposted) {
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reposts')
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;

        // Notify post owner
        if (postOwnerId && postOwnerId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: postOwnerId,
            actor_id: user.id,
            type: 'repost',
            post_id: postId,
          });
        }
      }
    },
    onSuccess: (_, { isReposted }) => {
      queryClient.invalidateQueries({ queryKey: ['is-reposted'] });
      queryClient.invalidateQueries({ queryKey: ['repost-count'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(isReposted ? 'Repost removed' : 'Reposted to your feed!');
    },
    onError: () => {
      toast.error('Failed to repost');
    },
  });
};

export const usePinPost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: !isPinned } as any)
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success(isPinned ? 'Post unpinned' : 'Post pinned to profile!');
    },
    onError: () => {
      toast.error('Failed to update pin status');
    },
  });
};
