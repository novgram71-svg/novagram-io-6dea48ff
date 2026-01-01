import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if push notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

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

      // For now, we'll store a placeholder token since we need Firebase SDK setup
      // In production, you'd get the actual FCM token here
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

  // Show a local notification (for testing/demo purposes)
  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

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
  const { permission, showLocalNotification } = usePushNotifications();

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('notification-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;
          
          // Get actor info
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);
};
