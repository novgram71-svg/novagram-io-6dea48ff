import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageWithProfile {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  edited_at: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  voice_url: string | null;
  reply_to_id: string | null;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  reactions?: MessageReaction[];
  reply_to?: MessageWithProfile | null;
}

export interface Conversation {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      (messages as MessageWithProfile[]).forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            username: partner.username,
            avatar_url: partner.avatar_url,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.receiver_id === user.id && !msg.read ? 1 : 0,
          });
        } else if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user,
  });
};

export const useMessages = (partnerId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`messages-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${partnerId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, queryClient]);

  return useQuery({
    queryKey: ['messages', partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read with timestamp
      await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      return data as MessageWithProfile[];
    },
    enabled: !!user && !!partnerId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      receiverId, 
      content, 
      imageUrl, 
      fileUrl, 
      fileName,
      voiceUrl,
      replyToId 
    }: { 
      receiverId: string; 
      content: string; 
      imageUrl?: string;
      fileUrl?: string;
      fileName?: string;
      voiceUrl?: string;
      replyToId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          image_url: imageUrl || null,
          file_url: fileUrl || null,
          file_name: fileName || null,
          voice_url: voiceUrl || null,
          reply_to_id: replyToId || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ content, edited_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMessageReactions = (messageId: string) => {
  return useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      return data as MessageReaction[];
    },
    enabled: !!messageId,
  });
};

export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
