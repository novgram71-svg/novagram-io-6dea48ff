import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSecurityQuestion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: securityQuestion, isLoading } = useQuery({
    queryKey: ['security-question', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('security_questions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const saveSecurityQuestion = useMutation({
    mutationFn: async ({ question, answer }: { question: string; answer: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Simple hash for answer (in production, use proper hashing)
      const answerHash = btoa(answer.toLowerCase().trim());
      
      const { error } = await supabase
        .from('security_questions')
        .insert({
          user_id: user.id,
          question,
          answer_hash: answerHash,
          is_locked: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-question', user?.id] });
    },
  });

  const verifyAnswer = async (answer: string): Promise<boolean> => {
    if (!securityQuestion) return false;
    const answerHash = btoa(answer.toLowerCase().trim());
    return answerHash === securityQuestion.answer_hash;
  };

  return {
    securityQuestion,
    isLoading,
    hasSecurityQuestion: !!securityQuestion,
    isLocked: securityQuestion?.is_locked || false,
    saveSecurityQuestion,
    verifyAnswer,
  };
};

export const useVerifySecurityQuestion = () => {
  return useMutation({
    mutationFn: async ({ userId, answer }: { userId: string; answer: string }) => {
      const { data, error } = await supabase
        .from('security_questions')
        .select('answer_hash')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('No security question found');
      
      const answerHash = btoa(answer.toLowerCase().trim());
      if (answerHash !== data.answer_hash) {
        throw new Error('Incorrect answer');
      }
      
      return true;
    },
  });
};
