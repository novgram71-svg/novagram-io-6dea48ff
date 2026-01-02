import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StoryMention {
  id: string;
  story_id: string;
  mentioned_user_id: string;
  position_x: number;
  position_y: number;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useStoryMentions = (storyId: string) => {
  return useQuery({
    queryKey: ['storyMentions', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_mentions')
        .select(`
          *,
          profiles!story_mentions_mentioned_user_id_fkey(id, username, avatar_url)
        `)
        .eq('story_id', storyId);

      if (error) throw error;
      return data as StoryMention[];
    },
  });
};

export const useAddStoryMention = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      storyId, 
      mentionedUserId, 
      positionX, 
      positionY 
    }: { 
      storyId: string; 
      mentionedUserId: string; 
      positionX: number; 
      positionY: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('story_mentions')
        .upsert(
          { 
            story_id: storyId, 
            mentioned_user_id: mentionedUserId,
            position_x: positionX,
            position_y: positionY
          },
          { onConflict: 'story_id,mentioned_user_id' }
        );

      if (error) throw error;
    },
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['storyMentions', storyId] });
    },
  });
};

export const useRemoveStoryMention = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, mentionedUserId }: { storyId: string; mentionedUserId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('story_mentions')
        .delete()
        .eq('story_id', storyId)
        .eq('mentioned_user_id', mentionedUserId);

      if (error) throw error;
    },
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['storyMentions', storyId] });
    },
  });
};
