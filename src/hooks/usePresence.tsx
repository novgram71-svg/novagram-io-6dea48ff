import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUpdatePresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updatePresence = async (isOnline: boolean) => {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) console.error('Error updating presence:', error);
    };

    // Set online when component mounts
    updatePresence(true);

    // Update presence periodically
    const interval = setInterval(() => updatePresence(true), 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      updatePresence(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence(false);
    };
  }, [user]);
};

export const useUserPresence = (userId: string | null) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // Initial fetch using RPC function for secure access
  const { data } = useQuery({
    queryKey: ['presence', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Use RPC function to respect activity_status privacy setting
      const { data, error } = await supabase
        .rpc('get_user_presence', { target_user_id: userId });

      if (error) {
        console.error('Error fetching presence:', error);
        return null;
      }
      return data?.[0] || null;
    },
    enabled: !!userId,
  });

  // Set initial state
  useEffect(() => {
    if (data) {
      setIsOnline(data.is_online || false);
      setLastSeen(data.last_seen || null);
    }
  }, [data]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`presence-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setIsOnline(payload.new.is_online);
            setLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { isOnline, lastSeen };
};
