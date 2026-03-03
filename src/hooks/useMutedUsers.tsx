import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useMutedUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['muted-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('muted_users')
        .select('muted_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(m => m.muted_id);
    },
    enabled: !!user?.id,
  });
};

export const useIsMuted = (targetUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-muted', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      const { data } = await supabase
        .from('muted_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('muted_id', targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId,
  });
};

export const useToggleMute = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isMuted }: { targetUserId: string; isMuted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isMuted) {
        const { error } = await supabase
          .from('muted_users')
          .delete()
          .eq('user_id', user.id)
          .eq('muted_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('muted_users')
          .insert({ user_id: user.id, muted_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isMuted }) => {
      queryClient.invalidateQueries({ queryKey: ['muted-users'] });
      queryClient.invalidateQueries({ queryKey: ['is-muted'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success(isMuted ? 'User unmuted' : 'User muted');
    },
    onError: () => {
      toast.error('Failed to update mute status');
    },
  });
};
