import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useAdmin';

export const usePasswordResetRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['password-reset-requests', user?.id],
    queryFn: async () => {
      console.log('Fetching password reset requests for admin:', user?.id);
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
      
      if (error) {
        console.error('Error fetching password reset requests:', error);
        throw error;
      }
      console.log('Password reset requests found:', data?.length);
      return data;
    },
    enabled: !!user && isAdmin === true,
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('approve-password-reset', {
        body: { requestId, action: 'approve' },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
      toast({
        title: 'Password Reset Approved',
        description: 'The user can now login with their new password.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('approve-password-reset', {
        body: { requestId, action: 'reject' },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
      toast({
        title: 'Password Reset Rejected',
        description: 'The user has been notified.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
