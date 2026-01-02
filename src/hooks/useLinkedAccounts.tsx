import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LinkedAccount {
  id: string;
  primary_user_id: string;
  linked_user_id: string;
  linked_email: string;
  linked_username: string;
  linked_avatar_url: string | null;
  created_at: string;
}

export const useLinkedAccounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['linked-accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('primary_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LinkedAccount[];
    },
    enabled: !!user,
  });
};

export const useAddLinkedAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      linkedUserId, 
      email, 
      username, 
      avatarUrl 
    }: { 
      linkedUserId: string;
      email: string;
      username: string;
      avatarUrl?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('linked_accounts')
        .insert({
          primary_user_id: user.id,
          linked_user_id: linkedUserId,
          linked_email: email,
          linked_username: username,
          linked_avatar_url: avatarUrl,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
    },
  });
};

export const useRemoveLinkedAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('linked_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
    },
  });
};