import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTrendingHashtags = () => {
  return useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useSearchHashtags = (query: string) => {
  return useQuery({
    queryKey: ['search-hashtags', query],
    queryFn: async () => {
      if (!query) return [];
      
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('post_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: query.length > 0,
  });
};

export const usePostsByHashtag = (hashtagName: string) => {
  return useQuery({
    queryKey: ['posts-by-hashtag', hashtagName],
    queryFn: async () => {
      if (!hashtagName) return [];
      
      const { data: hashtag, error: hashtagError } = await supabase
        .from('hashtags')
        .select('id')
        .eq('name', hashtagName.toLowerCase())
        .maybeSingle();
      
      if (hashtagError) throw hashtagError;
      if (!hashtag) return [];
      
      const { data: postHashtags, error: phError } = await supabase
        .from('post_hashtags')
        .select(`
          post_id,
          posts:post_id (
            *,
            profiles:user_id (
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('hashtag_id', hashtag.id);
      
      if (phError) throw phError;
      return postHashtags?.map(ph => ph.posts).filter(Boolean) || [];
    },
    enabled: !!hashtagName,
  });
};
