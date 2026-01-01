import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageNote {
  id: string;
  user_id: string;
  content: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useMessageNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message-notes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_notes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MessageNote[];
    },
    enabled: !!user,
  });
};

export const useMyNote = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-note', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('message_notes')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MessageNote | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Delete existing note first
      await supabase
        .from('message_notes')
        .delete()
        .eq('user_id', user.id);

      const { data, error } = await supabase
        .from('message_notes')
        .insert({
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast({
        title: 'Note shared',
        description: 'Your note will be visible for 24 hours.',
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
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_notes')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-notes'] });
      queryClient.invalidateQueries({ queryKey: ['my-note'] });
      toast({
        title: 'Note deleted',
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
};
