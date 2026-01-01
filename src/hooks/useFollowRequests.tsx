import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFollowRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: receivedRequests, isLoading: loadingReceived } = useQuery({
    queryKey: ['follow-requests-received', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          *,
          requester:requester_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('target_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: sentRequests, isLoading: loadingSent } = useQuery({
    queryKey: ['follow-requests-sent', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          *,
          target:target_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const sendRequest = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('follow_requests')
        .insert({
          requester_id: user.id,
          target_id: targetId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests-sent', user?.id] });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', user.id)
        .eq('target_id', targetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests-sent', user?.id] });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (requesterId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Update request status
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ status: 'approved' })
        .eq('requester_id', requesterId)
        .eq('target_id', user.id);
      
      if (updateError) throw updateError;
      
      // Create the follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: requesterId,
          following_id: user.id,
        });
      
      if (followError) throw followError;
      
      // Send notification to the requester that their request was accepted
      await supabase.from('notifications').insert({
        user_id: requesterId,
        actor_id: user.id,
        type: 'follow_accepted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests-received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requesterId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('follow_requests')
        .update({ status: 'rejected' })
        .eq('requester_id', requesterId)
        .eq('target_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests-received', user?.id] });
    },
  });

  const hasPendingRequest = (targetId: string) => {
    return sentRequests?.some(r => r.target_id === targetId && r.status === 'pending');
  };

  return {
    receivedRequests,
    sentRequests,
    loadingReceived,
    loadingSent,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
    hasPendingRequest,
  };
};
