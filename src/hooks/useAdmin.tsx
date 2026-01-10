import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data;
    },
    enabled: !!user,
  });
};

export const useAllUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      // Use secure function - admins get full data, others get masked email/phone
      const { data, error } = await supabase
        .rpc('get_all_profiles_safe');

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });
};

export const useAllPosts = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['allPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });
};

export const useUserMessages = (userId: string | null) => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['userMessages', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true && !!userId,
  });
};

export const useConversationPartners = (userId: string | null) => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['conversationPartners', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      // Get unique conversation partners
      const partners = new Map();
      data?.forEach((msg) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
        if (!partners.has(partnerId) && partner) {
          partners.set(partnerId, partner);
        }
      });

      return Array.from(partners.values());
    },
    enabled: isAdmin === true && !!userId,
  });
};

export const useConversation = (userId1: string | null, userId2: string | null) => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['conversation', userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true && !!userId1 && !!userId2,
  });
};

export const useAdminDeletePost = () => {
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!isAdmin) throw new Error('Not authorized');

      // Delete associated likes first
      await supabase.from('likes').delete().eq('post_id', postId);
      
      // Delete associated comments
      await supabase.from('comments').delete().eq('post_id', postId);
      
      // Delete saved posts references
      await supabase.from('saved_posts').delete().eq('post_id', postId);
      
      // Delete notifications related to this post
      await supabase.from('notifications').delete().eq('post_id', postId);
      
      // Delete the post (admin can delete any post via RLS policy)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
