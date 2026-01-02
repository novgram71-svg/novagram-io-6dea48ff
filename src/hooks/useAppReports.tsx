import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AppReport {
  id: string;
  user_id: string;
  problem: string;
  details: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useSubmitAppReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ problem, details }: { problem: string; details?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('app_reports')
        .insert({
          user_id: user.id,
          problem,
          details: details || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appReports'] });
      queryClient.invalidateQueries({ queryKey: ['myAppReports'] });
    },
  });
};

export const useMyAppReports = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myAppReports', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('app_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AppReport[];
    },
    enabled: !!user,
  });
};

export const useAllAppReports = () => {
  return useQuery({
    queryKey: ['appReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_reports')
        .select(`
          *,
          user:profiles!app_reports_user_id_fkey(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AppReport[];
    },
  });
};

export const useUpdateAppReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from('app_reports')
        .update({ 
          status, 
          resolved_at: status === 'resolved' ? new Date().toISOString() : null 
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appReports'] });
    },
  });
};
