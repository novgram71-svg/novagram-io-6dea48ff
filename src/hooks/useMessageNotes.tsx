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

interface NoteReaction {
  id: string;
  note_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
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

export const useNoteReactions = (noteId: string) => {
  return useQuery({
    queryKey: ['note-reactions', noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('note_reactions')
        .select('*')
        .eq('note_id', noteId);

      if (error) throw error;
      return data as NoteReaction[];
    },
    enabled: !!noteId,
  });
};

export const useMyNoteReaction = (noteId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-note-reaction', noteId, user?.id],
    queryFn: async () => {
      if (!user?.id || !noteId) return null;

      const { data, error } = await supabase
        .from('note_reactions')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as NoteReaction | null;
    },
    enabled: !!user?.id && !!noteId,
  });
};

export const useReactToNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if user already reacted
      const { data: existing } = await supabase
        .from('note_reactions')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.emoji === emoji) {
          // Remove reaction if same emoji clicked
          const { error } = await supabase
            .from('note_reactions')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
          return null;
        } else {
          // Update to new emoji
          const { data, error } = await supabase
            .from('note_reactions')
            .update({ emoji })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
      } else {
        // Create new reaction
        const { data, error } = await supabase
          .from('note_reactions')
          .insert({
            note_id: noteId,
            user_id: user.id,
            emoji,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['note-reactions', noteId] });
      queryClient.invalidateQueries({ queryKey: ['my-note-reaction', noteId] });
    },
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
