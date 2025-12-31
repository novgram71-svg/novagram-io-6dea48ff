import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProfileStats {
  postCount: number;
  followersCount: number;
  followingCount: number;
}

export const useProfile = (username: string | undefined) => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
};

export const useProfileById = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', 'id', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useProfileStats = (userId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profileStats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);

      return {
        postCount: postsRes.count || 0,
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0,
      } as ProfileStats;
    },
    enabled: !!userId,
  });
};

export const useIsFollowing = (targetUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isFollowing', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      targetUserId, 
      isFollowing, 
      isPrivate = false,
      hasPendingRequest = false 
    }: { 
      targetUserId: string; 
      isFollowing: boolean; 
      isPrivate?: boolean;
      hasPendingRequest?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return { action: 'unfollowed' };
      } else if (hasPendingRequest) {
        // Cancel request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', user.id)
          .eq('target_id', targetUserId);
        if (error) throw error;
        return { action: 'cancelled' };
      } else if (isPrivate) {
        // Send follow request for private account
        const { error } = await supabase
          .from('follow_requests')
          .insert({ requester_id: user.id, target_id: targetUserId });
        if (error) throw error;
        return { action: 'requested' };
      } else {
        // Direct follow for public account
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
        return { action: 'followed' };
      }
    },
    onSuccess: (_, { targetUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['profileStats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests-sent'] });
      queryClient.invalidateQueries({ queryKey: ['hasPendingRequest'] });
    },
  });
};

export const useHasPendingRequest = (targetUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hasPendingRequest', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;

      const { data } = await supabase
        .from('follow_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('target_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
};

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useSearchProfiles = (query: string) => {
  return useQuery({
    queryKey: ['searchProfiles', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
};
