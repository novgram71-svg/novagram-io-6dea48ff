import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  private_account: boolean;
  activity_status: boolean;
  read_receipts: boolean;
  push_notifications: boolean;
  like_notifications: boolean;
  comment_notifications: boolean;
  follow_notifications: boolean;
  message_notifications: boolean;
  dark_mode: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (insertError) throw insertError;
          return newSettings as UserSettings;
        }
        throw error;
      }
      
      return data as UserSettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to save setting');
      console.error('Settings update error:', error);
    },
  });

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    // Apply dark mode immediately
    if (key === 'dark_mode') {
      document.documentElement.classList.toggle('dark', value as boolean);
      localStorage.setItem('theme', value ? 'dark' : 'light');
    }
    
    await updateSettings.mutateAsync({ [key]: value });
  };

  return {
    settings,
    isLoading,
    updateSetting,
    isUpdating: updateSettings.isPending,
  };
};

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id);
      
      if (error) throw error;
      
      // Fetch profiles using secure batch function
      const blockedIds = data.map(b => b.blocked_id);
      if (blockedIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { user_ids: blockedIds });
      
      return data.map(b => ({
        ...b,
        profile: profiles?.find(p => p.id === b.blocked_id)
      }));
    },
    enabled: !!user?.id,
  });

  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users', user?.id] });
      toast.success('User unblocked');
    },
    onError: () => {
      toast.error('Failed to unblock user');
    },
  });

  return {
    blockedUsers,
    isLoading,
    unblockUser: unblockUser.mutate,
  };
};

export const useCloseFriends = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: closeFriends = [], isLoading } = useQuery({
    queryKey: ['close-friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('close_friends')
        .select('id, friend_id, created_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Fetch profiles using secure batch function
      const friendIds = data.map(f => f.friend_id);
      if (friendIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { user_ids: friendIds });
      
      return data.map(f => ({
        ...f,
        profile: profiles?.find(p => p.id === f.friend_id)
      }));
    },
    enabled: !!user?.id,
  });

  const addCloseFriend = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('close_friends')
        .insert({ user_id: user.id, friend_id: friendId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['close-friends', user?.id] });
      toast.success('Added to close friends');
    },
    onError: () => {
      toast.error('Failed to add close friend');
    },
  });

  const removeCloseFriend = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('close_friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['close-friends', user?.id] });
      toast.success('Removed from close friends');
    },
    onError: () => {
      toast.error('Failed to remove close friend');
    },
  });

  return {
    closeFriends,
    isLoading,
    addCloseFriend: addCloseFriend.mutate,
    removeCloseFriend: removeCloseFriend.mutate,
  };
};
