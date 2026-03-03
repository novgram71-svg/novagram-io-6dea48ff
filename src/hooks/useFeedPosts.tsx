import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PostWithUser } from './usePosts';
import { useMutedUsers } from './useMutedUsers';

export const useFeedPosts = () => {
  const { user } = useAuth();
  const { data: mutedIds = [] } = useMutedUsers();
  return useQuery({
    queryKey: ['feed-posts', user?.id, mutedIds],
    queryFn: async () => {
      if (!user) {
        // For non-authenticated users, show recent public posts
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(id, username, avatar_url),
            likes(user_id),
            comments(id)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return (data as PostWithUser[]).filter(p => !mutedIds.includes(p.user_id));
      }

      // Get following list
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Include user's own ID to show their posts too
      const userIds = [user.id, ...followingIds];

      if (userIds.length === 0) {
        return [];
      }

      // Fetch posts only from followed users and self
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as PostWithUser[]).filter(p => !mutedIds.includes(p.user_id));
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSuggestedUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get users the current user already follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      const excludeIds = [user.id, ...followingIds];

      // Get users not followed, ordered by follower count (popularity)
      const { data: profiles, error } = await supabase
        .rpc('search_profiles_safe', { search_query: '', result_limit: 20 });

      if (error) throw error;

      // Filter out already followed users and self
      const suggestions = profiles
        ?.filter((p: { id: string }) => !excludeIds.includes(p.id))
        .slice(0, 5);

      // Get follower counts for suggestions
      const suggestionsWithCounts = await Promise.all(
        (suggestions || []).map(async (profile: { id: string; username: string; avatar_url: string | null; bio: string | null }) => {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
          
          return {
            ...profile,
            followersCount: count || 0,
          };
        })
      );

      return suggestionsWithCounts.sort((a, b) => b.followersCount - a.followersCount);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
