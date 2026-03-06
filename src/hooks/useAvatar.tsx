import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AvatarConfig {
  gender: string;
  hair_style: string;
  hair_color: string;
  skin_tone: string;
  outfit: string;
  accessories: string;
}

export const useUserAvatar = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-avatar', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_avatars' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!userId,
  });
};

export const useGenerateAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: AvatarConfig) => {
      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: config,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-avatar', user?.id] });
    },
  });
};
