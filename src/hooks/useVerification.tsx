import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface VerificationData {
  id: string;
  user_id: string;
  points: number;
  is_verified: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
  verified_until: string | null;
  was_referred: boolean;
  admin_granted: boolean;
  pending_badge: boolean;
  badge_granted_by: string | null;
}

interface ReferralData {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
  referred_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useVerification = () => {
  const { user } = useAuth();

  const { data: verification, isLoading, refetch } = useQuery({
    queryKey: ['verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching verification:', error);
        return null;
      }
      
      // If no verification record exists, create one
      if (!data) {
        const referralCode = 'NOVA' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data: newData, error: insertError } = await supabase
          .from('user_verification')
          .insert({
            user_id: user.id,
            referral_code: referralCode,
            points: 0,
            is_verified: false,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating verification:', insertError);
          return null;
        }
        return newData as VerificationData;
      }
      
      return data as VerificationData;
    },
    enabled: !!user?.id,
  });

  return { verification, isLoading, refetch };
};

export const useUserVerificationStatus = (userId: string | undefined) => {
  const { data: isVerified, isLoading } = useQuery({
    queryKey: ['user-verification-status', userId],
    queryFn: async () => {
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from('user_verification')
        .select('is_verified, verified_until')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error || !data) return false;
      
      // Check if verification has expired
      if (data.verified_until && new Date(data.verified_until) < new Date()) {
        return false;
      }
      
      return data.is_verified;
    },
    enabled: !!userId,
  });

  return { isVerified: isVerified ?? false, isLoading };
};

export const useReferrals = () => {
  const { user } = useAuth();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          id,
          referrer_id,
          referred_id,
          created_at
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching referrals:', error);
        return [];
      }

      // Fetch profiles for referred users
      const referredIds = data.map(r => r.referred_id);
      if (referredIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', referredIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(r => ({
        ...r,
        referred_profile: profileMap.get(r.referred_id) || { username: 'Unknown', avatar_url: null }
      })) as ReferralData[];
    },
    enabled: !!user?.id,
  });

  return { referrals: referrals ?? [], isLoading };
};

export const useProcessReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      const { data, error } = await supabase
        .rpc('process_referral', { referral_code_input: referralCode });
      
      if (error) throw error;
      return data as { success: boolean; error?: string; referrer_points?: number; your_points?: number };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Referral applied! You earned ${data.your_points} points!`);
        queryClient.invalidateQueries({ queryKey: ['verification'] });
      } else {
        toast.error(data.error || 'Failed to apply referral code');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process referral');
    },
  });
};

export const useAdminGrantBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase
        .rpc('admin_grant_badge', { target_user_id: targetUserId });
      
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Nova badge sent! User will receive a notification.');
        queryClient.invalidateQueries({ queryKey: ['verification'] });
      } else {
        toast.error(data.error || 'Failed to grant badge');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to grant badge');
    },
  });
};

export const useAcceptBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('accept_badge');
      
      if (error) throw error;
      return data as { success: boolean; error?: string; verified_until?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['verification'] });
        queryClient.invalidateQueries({ queryKey: ['user-verification-status'] });
      } else {
        toast.error(data.error || 'Failed to accept badge');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept badge');
    },
  });
};

export const usePendingBadge = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-badge', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_verification')
        .select('pending_badge, badge_granted_by')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.pending_badge ? data : null;
    },
    enabled: !!user?.id,
  });
};
