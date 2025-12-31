import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePasswordResetRequests = () => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['password-reset-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'approved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
    },
  });

  return {
    requests,
    isLoading,
    approveRequest,
    rejectRequest,
  };
};

export const useMyResetRequest = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-reset-request', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateResetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPasswordHash }: { userId: string; newPasswordHash: string }) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: userId,
          new_password_hash: newPasswordHash,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
    },
  });
};
