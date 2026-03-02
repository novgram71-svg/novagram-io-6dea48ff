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

interface PendingVerification {
  email: string;
  // NOTE: Password is NOT stored in state for security - user must re-enter it during verification
  username: string;
  phoneNumber?: string;
  verificationCode: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isBanned: boolean;
  pendingVerification: PendingVerification | null;
  signUp: (email: string, password: string, username: string, phoneNumber?: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyEmail: (token: string, password: string) => Promise<{ error: any }>;
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
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);

  const fetchProfile = async (userId: string) => {
    // Use secure function to fetch profile - user can see their own data
    const { data, error } = await supabase
      .rpc('get_profile_safe', { profile_id: userId });
    
    if (!error && data?.[0]) {
      setProfile(data[0]);
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

  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = async (email: string, code: string, username?: string) => {
    const { error } = await supabase.functions.invoke('send-verification-email', {
      body: { email, code, username },
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, phoneNumber?: string) => {
    // Check if email is already registered using secure function
    const { data: emailExists } = await supabase
      .rpc('check_email_exists', { user_email: email });

    if (emailExists) {
      return { error: { message: 'User already registered' } };
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Send verification email via our edge function
    const { error: emailError } = await sendVerificationEmail(email, verificationCode, username);
    
    if (emailError) {
      console.error('Failed to send verification email:', emailError);
      return { error: { message: 'Failed to send verification email. Please try again.' } };
    }

    // Store pending verification data - NOTE: password is NOT stored for security
    setPendingVerification({ 
      email, 
      // password intentionally NOT stored - user must re-enter during verification
      username, 
      phoneNumber, 
      verificationCode,
      expiresAt,
    });
    
    return { error: null, needsVerification: true };
  };

  const verifyEmail = async (token: string, password: string) => {
    if (!pendingVerification) {
      return { error: { message: 'No pending verification' } };
    }

    // Check if code has expired
    if (Date.now() > pendingVerification.expiresAt) {
      return { error: { message: 'Verification code has expired. Please request a new one.' } };
    }

    // Verify the code matches
    if (token !== pendingVerification.verificationCode) {
      return { error: { message: 'Invalid verification code' } };
    }

    // Validate password is provided (security: password is passed fresh, not from state)
    if (!password || password.length < 6) {
      return { error: { message: 'Please enter your password to complete verification' } };
    }

    // Code is valid, now actually create the account
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: pendingVerification.email,
      password: password, // Use fresh password from parameter, not from state
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: pendingVerification.username,
          phone_number: pendingVerification.phoneNumber,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Update phone number in profile if provided
    if (data.user && pendingVerification.phoneNumber) {
      setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ phone_number: pendingVerification.phoneNumber })
          .eq('id', data.user!.id);
      }, 500);
    }

    setPendingVerification(null);
    return { error: null };
  };

  const resendVerificationCode = async () => {
    if (!pendingVerification) {
      return { error: { message: 'No pending verification' } };
    }

    // Generate new code
    const newCode = generateVerificationCode();
    const newExpiresAt = Date.now() + 10 * 60 * 1000;

    // Send new verification email
    const { error } = await sendVerificationEmail(
      pendingVerification.email, 
      newCode, 
      pendingVerification.username
    );

    if (error) {
      return { error: { message: 'Failed to resend verification code' } };
    }

    // Update pending verification with new code
    setPendingVerification({
      ...pendingVerification,
      verificationCode: newCode,
      expiresAt: newExpiresAt,
    });

    return { error: null };
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
