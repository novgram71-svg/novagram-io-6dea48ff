import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingUser {
  partnerId: string;
  isTyping: boolean;
}

export const useConversationTyping = (partnerIds: string[]) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || partnerIds.length === 0) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    partnerIds.forEach((partnerId) => {
      const channelName = [user.id, partnerId].sort().join('-');
      const channel = supabase.channel(`typing-list:${channelName}`);

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const partnerPresence = state[partnerId];
          
          if (partnerPresence && Array.isArray(partnerPresence)) {
            const isTyping = partnerPresence.some((p: any) => p.isTyping);
            setTypingUsers(prev => ({ ...prev, [partnerId]: isTyping }));
          } else {
            setTypingUsers(prev => ({ ...prev, [partnerId]: false }));
          }
        })
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => {
        channel.unsubscribe();
      });
    };
  }, [user, partnerIds.join(',')]);

  return typingUsers;
};
