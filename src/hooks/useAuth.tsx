import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isBanned: boolean;
  pendingVerification: { email: string; password: string; username: string; phoneNumber?: string } | null;
  signUp: (email: string, password: string, username: string, phoneNumber?: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ error: any }>;
  resendVerificationCode: () => Promise<{ error: any }>;
  clearPendingVerification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; password: string; username: string; phoneNumber?: string } | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const checkBanStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('banned_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error) {
      setIsBanned(!!data);
    }
  };

  const handleBanAndSignOut = useCallback(async () => {
    setIsBanned(true);
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Realtime subscription for immediate ban enforcement
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ban-check')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'banned_users',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // User was banned, sign them out immediately
          handleBanAndSignOut();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleBanAndSignOut]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkBanStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          // Don't reset isBanned here if user was banned - keep them banned
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkBanStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, phoneNumber?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Check if email confirmation is required (user exists but not confirmed)
    if (data.user && !data.session) {
      // Store pending verification data
      setPendingVerification({ email, password, username, phoneNumber });
      return { error: null, needsVerification: true };
    }

    // Update phone number in profile if provided and user is confirmed
    if (!error && data.user && data.session && phoneNumber) {
      await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('id', data.user.id);
    }
    
    return { error };
  };

  const verifyEmail = async (token: string) => {
    if (!pendingVerification) {
      return { error: { message: 'No pending verification' } };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: pendingVerification.email,
      token,
      type: 'email',
    });

    if (error) {
      return { error };
    }

    // Update phone number in profile if provided
    if (data.user && pendingVerification.phoneNumber) {
      await supabase
        .from('profiles')
        .update({ phone_number: pendingVerification.phoneNumber })
        .eq('id', data.user.id);
    }

    setPendingVerification(null);
    return { error: null };
  };

  const resendVerificationCode = async () => {
    if (!pendingVerification) {
      return { error: { message: 'No pending verification' } };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingVerification.email,
    });

    return { error };
  };

  const clearPendingVerification = () => {
    setPendingVerification(null);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsBanned(false);
    setPendingVerification(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      isBanned, 
      pendingVerification,
      signUp, 
      signIn, 
      signOut, 
      refreshProfile,
      verifyEmail,
      resendVerificationCode,
      clearPendingVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
