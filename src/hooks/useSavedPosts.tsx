import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useSavedPosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedPosts = [], isLoading } = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          post_id,
          created_at,
          posts (
            id,
            image_url,
            caption,
            created_at,
            user_id,
            profiles (
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const toggleSave = useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isSaved }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-saved'] });
      toast.success(isSaved ? 'Post unsaved' : 'Post saved');
    },
    onError: () => {
      toast.error('Failed to save post');
    },
  });

  return {
    savedPosts,
    isLoading,
    toggleSave: toggleSave.mutate,
    isToggling: toggleSave.isPending,
  };
};

export const useIsSaved = (postId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-saved', postId, user?.id],
    queryFn: async () => {
      if (!user?.id || !postId) return false;
      
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!postId,
  });
};
