import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useExplorePosts = () => {
  return useQuery({
    queryKey: ['explore-posts'],
    queryFn: async () => {
      // Get posts with their like counts for trending
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          likes (user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Sort by engagement (likes)
      const sortedPosts = posts?.sort((a, b) => {
        const aLikes = a.likes?.length || 0;
        const bLikes = b.likes?.length || 0;
        return bLikes - aLikes;
      });
      
      return sortedPosts || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useTrendingPosts = () => {
  return useQuery({
    queryKey: ['trending-posts'],
    queryFn: async () => {
      // Get posts from last 24 hours with most engagement
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          likes (user_id),
          comments (id)
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Sort by total engagement
      const sortedPosts = posts?.sort((a, b) => {
        const aEngagement = (a.likes?.length || 0) + (a.comments?.length || 0);
        const bEngagement = (b.likes?.length || 0) + (b.comments?.length || 0);
        return bEngagement - aEngagement;
      });
      
      return sortedPosts?.slice(0, 20) || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
