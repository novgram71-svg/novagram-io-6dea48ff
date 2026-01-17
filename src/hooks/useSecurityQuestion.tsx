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
      // Use the secure view that doesn't expose answer_hash
      const { data, error } = await supabase
        .from('security_questions_safe')
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
    // Use the secure database function to verify - never compare hashes client-side
    if (!user?.id) return false;
    const { data, error } = await supabase.rpc('verify_security_answer', {
      p_user_id: user.id,
      p_answer: answer
    });
    if (error) {
      console.error('Error verifying security answer:', error);
      return false;
    }
    return data === true;
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
      // Use the secure database function to verify - never expose answer_hash to client
      const { data, error } = await supabase.rpc('verify_security_answer', {
        p_user_id: userId,
        p_answer: answer
      });
      
      if (error) throw error;
      if (data !== true) {
        throw new Error('Incorrect answer');
      }
      
      return true;
    },
  });
};
