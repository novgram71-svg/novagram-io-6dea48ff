import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTypingIndicator = (partnerId: string | null) => {
  const { user } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !partnerId) return;

    const channelName = [user.id, partnerId].sort().join('-');
    const channel = supabase.channel(`typing:${channelName}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerPresence = state[partnerId];
        
        if (partnerPresence && Array.isArray(partnerPresence)) {
          const isTyping = partnerPresence.some((p: any) => p.isTyping);
          setIsPartnerTyping(isTyping);
        } else {
          setIsPartnerTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ isTyping: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      channel.unsubscribe();
    };
  }, [user, partnerId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    channelRef.current.track({ isTyping });

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.track({ isTyping: false });
      }, 3000);
    }
  }, [user]);

  return { isPartnerTyping, setTyping };
};
