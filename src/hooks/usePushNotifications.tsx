import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useCallback } from 'react';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if push notifications are supported
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Get current permission status
  const permission = isSupported ? Notification.permission : 'denied';

  // Request permission and register token
  const requestPermission = useMutation({
    mutationFn: async () => {
      if (!isSupported || !user) {
        throw new Error('Push notifications not supported or user not logged in');
      }

      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        throw new Error('Permission denied');
      }

      // Store a placeholder token for web notifications
      const token = `web_${user.id}_${Date.now()}`;
      
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: 'web',
        }, {
          onConflict: 'user_id,token',
        });

      if (error) throw error;

      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-token'] });
    },
  });

  // Get user's push token
  const { data: pushToken } = useQuery({
    queryKey: ['push-token', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Remove push token
  const removeToken = useMutation({
    mutationFn: async () => {
      if (!user || !pushToken) return;

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', pushToken.token);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-token'] });
    },
  });

  // Show a local notification
  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (isSupported && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    pushToken,
    requestPermission,
    removeToken,
    showLocalNotification,
  };
};

// Hook to listen for new notifications and show browser notifications
export const useNotificationListener = () => {
  const { user } = useAuth();
  const { showLocalNotification } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    
    // Check permission on mount
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    console.log('Setting up notification listener for user:', user.id);

    const channel = supabase
      .channel(`notification-alerts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new as any;
          
          // Get actor info
          if (notification.actor_id) {
            const { data: actor } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', notification.actor_id)
              .single();

            const messages: Record<string, string> = {
              like: 'liked your post',
              comment: 'commented on your post',
              follow: 'started following you',
              follow_request: 'requested to follow you',
              follow_accepted: 'accepted your follow request',
              story_like: 'liked your story',
              story_reply: 'replied to your story',
              message: 'sent you a message',
            };

            showLocalNotification(
              actor?.username || 'Someone',
              {
                body: messages[notification.type] || 'interacted with you',
                icon: actor?.avatar_url || '/favicon.ico',
                tag: notification.id,
              }
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification channel status:', status);
      });

    return () => {
      console.log('Cleaning up notification listener');
      supabase.removeChannel(channel);
    };
  }, [user, showLocalNotification]);
};