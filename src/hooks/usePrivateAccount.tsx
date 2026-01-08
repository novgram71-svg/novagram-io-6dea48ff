import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIsPrivateAccount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['is-private', userId],
    queryFn: async () => {
      if (!userId) return false;
      
      // Use RPC function for secure access to private status
      const { data, error } = await supabase
        .rpc('get_user_private_status', { target_user_id: userId });
      
      if (error) {
        console.error('Error checking private status:', error);
        return false;
      }
      return data || false;
    },
    enabled: !!userId,
  });
};

export const useCanViewProfile = (profileUserId: string | undefined, currentUserId: string | undefined) => {
  const { data: isPrivate } = useIsPrivateAccount(profileUserId);
  
  return useQuery({
    queryKey: ['can-view-profile', profileUserId, currentUserId, isPrivate],
    queryFn: async () => {
      // If not private, anyone can view
      if (!isPrivate) return true;
      
      // If own profile, can view
      if (profileUserId === currentUserId) return true;
      
      // If not logged in, cannot view private
      if (!currentUserId) return false;
      
      // Check if following
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', profileUserId)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!profileUserId && isPrivate !== undefined,
  });
};