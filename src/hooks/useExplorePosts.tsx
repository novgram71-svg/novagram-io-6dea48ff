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
          likes (count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Sort by engagement (likes)
      const sortedPosts = posts?.sort((a, b) => {
        const aLikes = a.likes?.[0]?.count || 0;
        const bLikes = b.likes?.[0]?.count || 0;
        return bLikes - aLikes;
      });
      
      return sortedPosts || [];
    },
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
          likes (count),
          comments (count)
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Sort by total engagement
      const sortedPosts = posts?.sort((a, b) => {
        const aEngagement = (a.likes?.[0]?.count || 0) + (a.comments?.[0]?.count || 0);
        const bEngagement = (b.likes?.[0]?.count || 0) + (b.comments?.[0]?.count || 0);
        return bEngagement - aEngagement;
      });
      
      return sortedPosts?.slice(0, 20) || [];
    },
  });
};
