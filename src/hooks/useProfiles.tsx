import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProfileStats {
  postCount: number;
  followersCount: number;
  followingCount: number;
}

export const useProfile = (username: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', username, user?.id],
    queryFn: async () => {
      if (!username) return null;

      // First search to find user by username
      const { data: searchResult, error: searchError } = await supabase
        .rpc('search_profiles_safe', { search_query: username, result_limit: 1 });

      if (searchError) throw searchError;
      
      // Find exact match
      const exactMatch = searchResult?.find((p: { username: string }) => 
        p.username.toLowerCase() === username.toLowerCase()
      );
      
      if (!exactMatch) return null;
      
      // Get full profile with privacy controls
      const { data, error } = await supabase
        .rpc('get_profile_safe', { profile_id: exactMatch.id });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!username,
  });
};

export const useProfileById = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', 'id', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Use secure function that masks email/phone for non-owners
      const { data, error } = await supabase
        .rpc('get_profile_safe', { profile_id: userId });

      if (error) throw error;
      return data?.[0] || null;
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
        return { action: 'unfollowed', targetUserId };
      } else if (hasPendingRequest) {
        // Cancel request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', user.id)
          .eq('target_id', targetUserId);
        if (error) throw error;
        return { action: 'cancelled', targetUserId };
      } else if (isPrivate) {
        // Send follow request for private account
        const { error } = await supabase
          .from('follow_requests')
          .insert({ requester_id: user.id, target_id: targetUserId });
        if (error) throw error;
        
        // Create follow_request notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'follow_request',
        });
        
        return { action: 'requested', targetUserId };
      } else {
        // Direct follow for public account
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
        
        // Create follow notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'follow',
        });
        
        return { action: 'followed', targetUserId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['profileStats', result?.targetUserId] });
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
      // Use secure function that returns masked data for non-admins
      const { data, error } = await supabase
        .rpc('get_all_profiles_safe');

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

      // Use secure search function
      const { data, error } = await supabase
        .rpc('search_profiles_safe', { search_query: query, result_limit: 20 });

      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
};
