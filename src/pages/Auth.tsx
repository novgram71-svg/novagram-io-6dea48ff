import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Sparkles, Camera, Heart, MessageCircle, Users, Phone, Mail, User, ArrowLeft, RefreshCw } from 'lucide-react';
import Logo3D from '@/components/ui/Logo3D';
import FloatingIcons from '@/components/auth/FloatingIcons';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityQuestion } from '@/hooks/useSecurityQuestion';
import { SecurityQuestionDialog } from '@/components/auth/SecurityQuestionDialog';
import { ForgotPasswordSheet } from '@/components/auth/ForgotPasswordSheet';
import { useProcessReferral } from '@/hooks/useVerification';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
const phoneSchema = z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref');
  
  const [isLogin, setIsLogin] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'username'>('email');
  const [prevLoginMethod, setPrevLoginMethod] = useState<'email' | 'phone' | 'username'>('email');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; phone?: string }>({});
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  const processReferral = useProcessReferral();
  
  // Store referral code from URL for processing after signup
  useEffect(() => {
    if (referralCodeFromUrl) {
      setPendingReferral(referralCodeFromUrl);
      setIsLogin(false); // Switch to signup mode if coming from referral link
    }
  }, [referralCodeFromUrl]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);
  
  // Handle mode switch with swipe animation
  const handleModeSwitch = () => {
    setIsTransitioning(true);
    setSlideDirection(isLogin ? 'left' : 'right');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };
  
  // Handle tab switch with smooth transition
  const handleTabSwitch = (newMethod: 'email' | 'phone' | 'username') => {
    const methodOrder = ['email', 'phone', 'username'];
    const currentIndex = methodOrder.indexOf(loginMethod);
    const newIndex = methodOrder.indexOf(newMethod);
    setPrevLoginMethod(loginMethod);
    setLoginMethod(newMethod);
  };
  
  const { signIn, signUp, user, pendingVerification, verifyEmail, resendVerificationCode, clearPendingVerification } = useAuth();
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
        
        // Process pending referral code
        if (pendingReferral) {
          try {
            await processReferral.mutateAsync(pendingReferral);
            setPendingReferral(null);
          } catch (error) {
            console.error('Error processing referral:', error);
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
  }, [user, hasSecurityQuestion, loadingSecurityQuestion, navigate, pendingReferral, processReferral]);

  const handleSecurityQuestionComplete = () => {
    setShowSecurityDialog(false);
    navigate('/');
  };

  const createRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
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
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: 'Email not verified',
              description: 'Please verify your email before logging in.',
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
        const { error, needsVerification } = await signUp(email, password, username, phoneNumber);
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
        } else if (needsVerification) {
          setResendCountdown(60);
          toast({
            title: 'Verification code sent!',
            description: 'Please check your email for the verification code.',
          });
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

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyEmail(verificationCode);
      if (error) {
        toast({
          title: 'Verification failed',
          description: error.message || 'Invalid or expired verification code.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email verified!',
          description: 'Your account has been verified successfully.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const { error } = await resendVerificationCode();
      if (error) {
        toast({
          title: 'Failed to resend',
          description: error.message || 'Could not resend verification code.',
          variant: 'destructive',
        });
      } else {
        setResendCountdown(60);
        toast({
          title: 'Code resent!',
          description: 'A new verification code has been sent to your email.',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackFromVerification = () => {
    clearPendingVerification();
    setVerificationCode('');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative will-change-transform transform-gpu">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background z-0">
        {/* Soft gradient orbs for light diffusion - reduced for mobile performance */}
        <div className="absolute top-0 left-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-primary/10 blur-[80px] sm:blur-[120px] animate-float-gentle" />
        <div className="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-accent/10 blur-[70px] sm:blur-[100px] animate-float-gentle" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-primary/5 blur-[60px] sm:blur-[80px] animate-liquid-pulse" />
      </div>

      {/* Floating icons background - above gradient */}
      <FloatingIcons />

      {/* Subtle grid pattern overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] z-[2]" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main card container */}
      <div className="w-full max-w-md relative z-10">
        {/* Liquid glass border effect */}
        <div className="relative rounded-[2rem] p-[2px]">
          {/* Animated liquid border */}
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
            <div 
              className="absolute inset-[-100%] animate-water-rotate"
              style={{ 
                background: `conic-gradient(from 0deg at 50% 50%, 
                  hsl(var(--primary)) 0deg, 
                  hsl(var(--accent)) 60deg, 
                  hsl(var(--primary) / 0.3) 120deg, 
                  hsl(var(--accent) / 0.8) 180deg, 
                  hsl(var(--primary)) 240deg, 
                  hsl(var(--accent) / 0.5) 300deg, 
                  hsl(var(--primary)) 360deg)`,
              }} 
            />
          </div>
          
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-[2.25rem] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl opacity-60 animate-glow-pulse" />
          
          {/* Main glass card */}
          <div 
            ref={cardRef}
            onClick={createRipple}
            className="relative liquid-glass rounded-[calc(2rem-2px)] p-6 sm:p-8 overflow-hidden"
          >
            {/* Top highlight edge */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-[calc(2rem-2px)] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-[calc(2rem-2px)] pointer-events-none">
              <div className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-liquid-shimmer" />
            </div>
            
            {/* Floating micro bubbles */}
            <div className="absolute inset-0 overflow-hidden rounded-[calc(2rem-2px)] pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute rounded-full bg-white/10 animate-bubble-rise"
                  style={{ 
                    left: `${10 + i * 12}%`,
                    bottom: 0,
                    width: `${6 + (i % 3) * 4}px`,
                    height: `${6 + (i % 3) * 4}px`,
                    animationDelay: `${i * 0.6}s`,
                    animationDuration: `${4 + (i % 2)}s`,
                  }} 
                />
              ))}
            </div>
            
            {/* Click ripple effects */}
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20,
                }}
              />
            ))}

            {/* Content */}
            <div className="relative z-10 space-y-6">
              {/* Logo */}
              <div className="text-center animate-slide-up flex flex-col items-center">
                <div className="mb-4">
                  <Logo3D size="lg" showText={false} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent mb-2">
                  Novagram
                </h1>
                <p className="text-muted-foreground text-sm font-light">
                  {pendingVerification 
                    ? 'Verify your email' 
                    : isLogin 
                      ? 'Welcome back' 
                      : 'Create your account'}
                </p>
              </div>

              {/* Verification Code Form */}
              {pendingVerification ? (
                <div className="space-y-6 animate-slide-up">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      We've sent a verification code to
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {pendingVerification.email}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      value={verificationCode}
                      onChange={setVerificationCode}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="liquid-glass-input w-12 h-14 text-xl" />
                        <InputOTPSlot index={1} className="liquid-glass-input w-12 h-14 text-xl" />
                        <InputOTPSlot index={2} className="liquid-glass-input w-12 h-14 text-xl" />
                        <InputOTPSlot index={3} className="liquid-glass-input w-12 h-14 text-xl" />
                        <InputOTPSlot index={4} className="liquid-glass-input w-12 h-14 text-xl" />
                        <InputOTPSlot index={5} className="liquid-glass-input w-12 h-14 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="w-full h-12 rounded-xl liquid-glass-button text-white font-medium text-base relative overflow-hidden group"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Verify Email
                        </>
                      )}
                    </span>
                  </Button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBackFromVerification}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCountdown > 0 || isResending}
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                    >
                      {isResending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              ) : (
              /* Form with swipe transition */
              <div 
                ref={formContainerRef}
                className={`transition-all duration-300 ease-out ${
                  isTransitioning 
                    ? slideDirection === 'left' 
                      ? 'opacity-0 translate-x-[-20px]' 
                      : 'opacity-0 translate-x-[20px]'
                    : 'opacity-100 translate-x-0'
                }`}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isLogin ? (
                    <>
                      {/* Login method tabs - simple style */}
                      <div className="animate-slide-up stagger-1">
                        <div className="w-full grid grid-cols-3 liquid-glass h-11 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setLoginMethod('email')}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                              loginMethod === 'email' 
                                ? "bg-primary/20 text-primary shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoginMethod('phone')}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                              loginMethod === 'phone' 
                                ? "bg-primary/20 text-primary shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Phone
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoginMethod('username')}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                              loginMethod === 'username' 
                                ? "bg-primary/20 text-primary shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            <User className="w-3.5 h-3.5" />
                            Username
                          </button>
                        </div>
                      </div>

                    <div className="space-y-1.5 animate-slide-up stagger-2">
                      <Label htmlFor="loginIdentifier" className="text-sm font-medium text-foreground/80">
                        {loginMethod === 'email' ? 'Email address' : loginMethod === 'phone' ? 'Phone number' : 'Username'}
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
                        className="liquid-glass-input h-12 rounded-xl px-4 text-base placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 animate-slide-up stagger-1">
                      <Label htmlFor="username" className="text-sm font-medium text-foreground/80">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="liquid-glass-input h-12 rounded-xl px-4 text-base placeholder:text-muted-foreground/50"
                      />
                      {errors.username && (
                        <p className="text-destructive text-xs animate-fade-in mt-1">{errors.username}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 animate-slide-up stagger-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="liquid-glass-input h-12 rounded-xl px-4 text-base placeholder:text-muted-foreground/50"
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs animate-fade-in mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 animate-slide-up stagger-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="liquid-glass-input h-12 rounded-xl px-4 text-base placeholder:text-muted-foreground/50"
                      />
                      {errors.phone && (
                        <p className="text-destructive text-xs animate-fade-in mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </>
                )}

                  {/* Password field */}
                  <div className="space-y-1.5 animate-slide-up stagger-3">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="liquid-glass-input h-12 rounded-xl px-4 pr-12 text-base placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs animate-fade-in mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Forgot password link */}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary/80 hover:text-primary font-medium transition-colors animate-slide-up stagger-3"
                    >
                      Forgot password?
                    </button>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl liquid-glass-button text-white font-medium text-base animate-slide-up stagger-4 relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    {/* Button shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isLogin ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {isLogin ? 'Sign In' : 'Create Account'}
                        </>
                      )}
                    </span>
                  </Button>
                </form>
              </div>
              )}

              {/* Toggle auth mode */}
              {!pendingVerification && (
              <div className="text-center animate-slide-up stagger-5">
                <p className="text-muted-foreground text-sm">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={handleModeSwitch}
                    className="text-primary font-medium hover:underline underline-offset-4 transition-all duration-200"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3 animate-slide-up stagger-5">
          <p className="text-xs text-muted-foreground/60">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
            <span>© 2026 Novagram</span>
            <span>•</span>
            <span>Created by <span className="text-foreground/60">Sampath</span></span>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SecurityQuestionDialog 
        open={showSecurityDialog} 
        onComplete={handleSecurityQuestionComplete} 
      />
      <ForgotPasswordSheet 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  );
};

export default Auth;