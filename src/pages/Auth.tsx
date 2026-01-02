import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Sparkles, Camera, Heart, MessageCircle, Users, Phone, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityQuestion } from '@/hooks/useSecurityQuestion';
import { SecurityQuestionDialog } from '@/components/auth/SecurityQuestionDialog';
import { ForgotPasswordSheet } from '@/components/auth/ForgotPasswordSheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
const phoneSchema = z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'username'>('email');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; phone?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const { hasSecurityQuestion, isLoading: loadingSecurityQuestion } = useSecurityQuestion();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const linkAccountIfNeeded = async () => {
      if (user && !loadingSecurityQuestion) {
        // Store session for this account for seamless switching
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const storedSessions = JSON.parse(localStorage.getItem('account_sessions') || '{}');
          storedSessions[user.id] = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
          localStorage.setItem('account_sessions', JSON.stringify(storedSessions));
        }
        
        // Check if we need to link accounts
        const pendingLink = localStorage.getItem('pending_link_account');
        if (pendingLink) {
          try {
            const previousAccount = JSON.parse(pendingLink);
            // Link the new account to the previous one
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('username, avatar_url, email')
              .eq('id', user.id)
              .single();
            
            if (currentProfile && previousAccount.userId !== user.id) {
              // Add this account as linked to the previous user's account
              await supabase.from('linked_accounts').upsert({
                primary_user_id: previousAccount.userId,
                linked_user_id: user.id,
                linked_email: user.email || '',
                linked_username: currentProfile.username,
                linked_avatar_url: currentProfile.avatar_url,
              }, { onConflict: 'primary_user_id,linked_user_id' });
              
              // Also link in reverse direction
              await supabase.from('linked_accounts').upsert({
                primary_user_id: user.id,
                linked_user_id: previousAccount.userId,
                linked_email: previousAccount.email || '',
                linked_username: previousAccount.username,
                linked_avatar_url: previousAccount.avatarUrl,
              }, { onConflict: 'primary_user_id,linked_user_id' });
            }
          } catch (error) {
            console.error('Error linking accounts:', error);
          } finally {
            localStorage.removeItem('pending_link_account');
          }
        }
        
        if (!hasSecurityQuestion) {
          setShowSecurityDialog(true);
        } else {
          navigate('/');
        }
      }
    };
    
    linkAccountIfNeeded();
  }, [user, hasSecurityQuestion, loadingSecurityQuestion, navigate]);

  const handleSecurityQuestionComplete = () => {
    setShowSecurityDialog(false);
    navigate('/');
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!isLogin) {
      try {
        emailSchema.parse(email);
      } catch (e: any) {
        newErrors.email = e.errors[0].message;
      }
      
      try {
        usernameSchema.parse(username);
      } catch (e: any) {
        newErrors.username = e.errors[0].message;
      }

      try {
        phoneSchema.parse(phoneNumber);
      } catch (e: any) {
        newErrors.phone = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = e.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const findUserByIdentifier = async (identifier: string): Promise<string | null> => {
    // Try email first
    let { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', identifier)
      .maybeSingle();
    
    if (data?.email) return data.email;

    // Try username
    ({ data } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .maybeSingle());
    
    if (data?.email) return data.email;

    // Try phone
    ({ data } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone_number', identifier)
      .maybeSingle());
    
    if (data?.email) return data.email;

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Find user email by identifier
        const userEmail = await findUserByIdentifier(loginIdentifier);
        
        if (!userEmail) {
          toast({
            title: 'Login failed',
            description: 'No account found with this email, username, or phone number.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(userEmail, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid credentials. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, username, phoneNumber);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Sign up failed',
              description: 'An account with this email already exists. Please log in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Please set up your security question.',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-accent/20 blur-xl animate-float stagger-2" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-primary/10 blur-xl animate-float stagger-3" />
        <div className="absolute bottom-40 right-1/4 w-28 h-28 rounded-full bg-accent/15 blur-xl animate-float stagger-4" />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Camera className="absolute top-[15%] left-[10%] w-8 h-8 text-primary/30 animate-bounce-gentle stagger-1" />
        <Heart className="absolute top-[25%] right-[15%] w-6 h-6 text-destructive/40 animate-bounce-gentle stagger-2" />
        <MessageCircle className="absolute bottom-[30%] left-[15%] w-7 h-7 text-primary/30 animate-bounce-gentle stagger-3" />
        <Users className="absolute bottom-[25%] right-[10%] w-8 h-8 text-accent/30 animate-bounce-gentle stagger-4" />
        <Sparkles className="absolute top-[60%] left-[5%] w-5 h-5 text-primary/40 animate-bounce-gentle stagger-5" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="nova-card p-8 space-y-6 backdrop-blur-xl bg-card/80 animate-slide-up shadow-2xl">
          {/* Logo with animation */}
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 animate-pulse-soft shadow-lg">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2 animate-gradient bg-clip-text">Novagram</h1>
            <p className="text-muted-foreground text-sm animate-slide-up stagger-1">
              {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account and start sharing'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              /* Login Form */
              <>
                <div className="space-y-2 animate-slide-up stagger-2">
                  <Label>Login with</Label>
                  <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as any)} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="email" className="gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="phone" className="gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </TabsTrigger>
                      <TabsTrigger value="username" className="gap-1">
                        <User className="w-3 h-3" />
                        Username
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2 animate-slide-up stagger-2">
                  <Label htmlFor="loginIdentifier">
                    {loginMethod === 'email' ? 'Email' : loginMethod === 'phone' ? 'Phone Number' : 'Username'}
                  </Label>
                  <Input
                    id="loginIdentifier"
                    type={loginMethod === 'email' ? 'email' : 'text'}
                    placeholder={
                      loginMethod === 'email' ? 'you@example.com' : 
                      loginMethod === 'phone' ? '+1 234 567 8900' : 
                      'johndoe'
                    }
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="nova-input transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
              </>
            ) : (
              /* Signup Form */
              <>
                <div className="space-y-2 animate-slide-up stagger-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="nova-input transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  {errors.username && (
                    <p className="text-destructive text-sm animate-fade-in">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2 animate-slide-up stagger-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="nova-input transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm animate-fade-in">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2 animate-slide-up stagger-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="nova-input transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm animate-fade-in">{errors.phone}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2 animate-slide-up stagger-3">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nova-input pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm animate-fade-in">{errors.password}</p>
              )}
            </div>

            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline animate-slide-up stagger-3"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up stagger-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center animate-slide-up stagger-5">
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary hover:underline font-medium transition-all duration-200 hover:text-accent"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-6 space-y-2 animate-slide-up stagger-5">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          <div className="pt-4 border-t border-border/50 space-y-1">
            <p className="text-xs text-muted-foreground">© 2026 All rights reserved</p>
            <p className="text-xs text-muted-foreground">Created by <span className="font-medium text-foreground">Sampath</span></p>
            <p className="text-xs text-muted-foreground">Contact: <a href="mailto:sampathlox@gmail.com" className="text-primary hover:underline">sampathlox@gmail.com</a></p>
          </div>
        </div>
      </div>

      {/* Security Question Dialog */}
      <SecurityQuestionDialog 
        open={showSecurityDialog} 
        onComplete={handleSecurityQuestionComplete} 
      />

      {/* Forgot Password Sheet */}
      <ForgotPasswordSheet 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  );
};

export default Auth;