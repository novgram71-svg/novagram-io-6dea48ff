import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAbuseReport {
  id: string;
  user_id: string;
  message_content: string;
  detected_issues: string[];
  severity: string;
  reviewed: boolean;
  created_at: string;
}

export const useAIAbuseReports = () => {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['ai-abuse-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_abuse_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AIAbuseReport[];
    },
  });

  const markReviewed = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('ai_abuse_reports')
        .update({ reviewed: true })
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-abuse-reports'] });
      toast.success('Report marked as reviewed');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });

  return {
    reports,
    isLoading,
    markReviewed: markReviewed.mutate,
  };
};
