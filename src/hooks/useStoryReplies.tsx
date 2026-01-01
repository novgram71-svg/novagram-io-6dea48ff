import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StoryReplyWithSender {
  id: string;
  story_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export const useStoryReplies = (storyId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['story-replies', storyId],
    queryFn: async () => {
      if (!storyId || !user) return [];

      const { data, error } = await supabase
        .from('story_replies')
        .select(`
          *,
          sender:profiles!story_replies_sender_id_fkey(id, username, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StoryReplyWithSender[];
    },
    enabled: !!storyId && !!user,
  });
};

export const useSendStoryReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, content, storyOwnerId }: { 
      storyId: string; 
      content: string;
      storyOwnerId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for story owner
      if (storyOwnerId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: storyOwnerId,
          actor_id: user.id,
          type: 'story_reply',
        });
      }

      // Also send as a direct message
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: storyOwnerId,
        content: `Replied to your story: ${content}`,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-replies', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useStoryLike = (storyId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['story-like', storyId, user?.id],
    queryFn: async () => {
      if (!storyId || !user) return false;

      const { data, error } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!storyId && !!user,
  });
};

export const useToggleStoryLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, storyOwnerId, isLiked }: { 
      storyId: string; 
      storyOwnerId: string;
      isLiked: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('story_likes')
          .insert({
            story_id: storyId,
            user_id: user.id,
          });

        if (error) throw error;

        // Create notification for story owner
        if (storyOwnerId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: storyOwnerId,
            actor_id: user.id,
            type: 'story_like',
          });
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-like', variables.storyId] });
    },
  });
};
