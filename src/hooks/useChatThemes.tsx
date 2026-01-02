import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatTheme {
  id: string;
  name: string;
  backgroundGradient: string;
  sentBubbleGradient: string;
  sentTextColor: string;
  receivedBubbleColor: string;
  receivedTextColor: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'default',
    name: 'Default',
    backgroundGradient: 'bg-background',
    sentBubbleGradient: 'bg-primary',
    sentTextColor: 'text-primary-foreground',
    receivedBubbleColor: 'bg-secondary',
    receivedTextColor: 'text-secondary-foreground',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    backgroundGradient: 'bg-gradient-to-b from-cyan-950/20 to-blue-950/30',
    sentBubbleGradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    sentTextColor: 'text-white',
    receivedBubbleColor: 'bg-blue-900/40',
    receivedTextColor: 'text-cyan-100',
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    backgroundGradient: 'bg-gradient-to-b from-orange-950/20 to-pink-950/30',
    sentBubbleGradient: 'bg-gradient-to-r from-orange-500 to-pink-500',
    sentTextColor: 'text-white',
    receivedBubbleColor: 'bg-orange-900/40',
    receivedTextColor: 'text-orange-100',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    backgroundGradient: 'bg-gradient-to-b from-emerald-950/20 to-green-950/30',
    sentBubbleGradient: 'bg-gradient-to-r from-emerald-500 to-green-600',
    sentTextColor: 'text-white',
    receivedBubbleColor: 'bg-green-900/40',
    receivedTextColor: 'text-emerald-100',
  },
  {
    id: 'lavender',
    name: 'Lavender Dreams',
    backgroundGradient: 'bg-gradient-to-b from-purple-950/20 to-violet-950/30',
    sentBubbleGradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
    sentTextColor: 'text-white',
    receivedBubbleColor: 'bg-purple-900/40',
    receivedTextColor: 'text-purple-100',
  },
];

export const useChatTheme = (partnerId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chatTheme', user?.id, partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return CHAT_THEMES[0];

      const { data, error } = await supabase
        .from('chat_themes')
        .select('theme_id')
        .or(`and(user_id.eq.${user.id},partner_id.eq.${partnerId}),and(user_id.eq.${partnerId},partner_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.theme_id) {
        return CHAT_THEMES.find(t => t.id === data.theme_id) || CHAT_THEMES[0];
      }
      return CHAT_THEMES[0];
    },
    enabled: !!user && !!partnerId,
  });
};

export const useSetChatTheme = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ partnerId, themeId }: { partnerId: string; themeId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_themes')
        .upsert(
          { user_id: user.id, partner_id: partnerId, theme_id: themeId },
          { onConflict: 'user_id,partner_id' }
        );

      if (error) throw error;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ['chatTheme', user?.id, partnerId] });
    },
  });
};
