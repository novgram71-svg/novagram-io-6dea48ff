import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LoginActivity {
  id: string;
  user_id: string;
  device_info: string | null;
  ip_address: string | null;
  location: string | null;
  logged_in_at: string;
  is_current: boolean;
}

export const useLoginActivity = () => {
  const { user } = useAuth();

  const { data: loginActivity = [], isLoading } = useQuery({
    queryKey: ['login-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_in_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as LoginActivity[];
    },
    enabled: !!user?.id,
  });

  return {
    loginActivity,
    isLoading,
  };
};

// Function to record login activity (called from auth)
export const recordLoginActivity = async (userId: string) => {
  try {
    // Get device info
    const deviceInfo = `${navigator.platform} - ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown'}`;
    
    // Mark all previous sessions as not current
    await supabase
      .from('login_activity')
      .update({ is_current: false })
      .eq('user_id', userId);
    
    // Insert new login activity
    await supabase.from('login_activity').insert({
      user_id: userId,
      device_info: deviceInfo,
      is_current: true,
    });
  } catch (error) {
    console.error('Failed to record login activity:', error);
  }
};
