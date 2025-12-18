import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Block user hooks
export const useIsBlocked = (targetUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isBlocked', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!targetUserId,
  });
};

export const useToggleBlock = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isBlocked }: { targetUserId: string; isBlocked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isBlocked) {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: user.id, blocked_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUserId, isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ['isBlocked', user?.id, targetUserId] });
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    },
    onError: () => {
      toast.error('Failed to update block status');
    },
  });
};

// Report user hooks
export const useReportUser = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportedUserId, reason, description }: { reportedUserId: string; reason: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          description,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReports'] });
      toast.success('Report submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });
};

// Admin hooks for reports
export const useAllReports = () => {
  return useQuery({
    queryKey: ['allReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          *,
          reporter:profiles!user_reports_reporter_id_fkey(id, username, avatar_url),
          reported:profiles!user_reports_reported_user_id_fkey(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateReportStatus = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_reports')
        .update({ 
          status, 
          resolved_at: status !== 'pending' ? new Date().toISOString() : null,
          resolved_by: status !== 'pending' ? user.id : null
        })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
      toast.success('Report status updated');
    },
    onError: () => {
      toast.error('Failed to update report status');
    },
  });
};

// Admin hooks for banning
export const useAllBannedUsers = () => {
  return useQuery({
    queryKey: ['allBannedUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select(`
          *,
          user:profiles!banned_users_user_id_fkey(id, username, avatar_url),
          banned_by_user:profiles!banned_users_banned_by_fkey(id, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useIsBanned = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['isBanned', userId],
    queryFn: async () => {
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from('banned_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });
};

export const useBanUser = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('banned_users')
        .insert({
          user_id: userId,
          banned_by: user.id,
          reason,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBannedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['isBanned'] });
      toast.success('User banned successfully');
    },
    onError: () => {
      toast.error('Failed to ban user');
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBannedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['isBanned'] });
      toast.success('User unbanned successfully');
    },
    onError: () => {
      toast.error('Failed to unban user');
    },
  });
};
