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
// Security question is now optional - not forced on new users
import { ForgotPasswordSheet } from '@/components/auth/ForgotPasswordSheet';
import { useProcessReferral } from '@/hooks/useVerification';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
const phoneSchema = z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format').optional().or(z.literal(''));

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; phone?: string }>({});
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPassword, setVerificationPassword] = useState(''); // Password re-entry for security
  const [showVerificationPassword, setShowVerificationPassword] = useState(false);
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const linkAccountIfNeeded = async () => {
      if (user) {
        // Security: Remove any previously stored account sessions (legacy cleanup)
        localStorage.removeItem('account_sessions');
        
        // Check if we need to link accounts
        const pendingLink = localStorage.getItem('pending_link_account');
        if (pendingLink) {
          try {
            const previousAccount = JSON.parse(pendingLink);
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('username, avatar_url, email')
              .eq('id', user.id)
              .single();
            
            if (currentProfile && previousAccount.userId !== user.id) {
              await supabase.from('linked_accounts').upsert({
                primary_user_id: previousAccount.userId,
                linked_user_id: user.id,
                linked_email: user.email || '',
                linked_username: currentProfile.username,
                linked_avatar_url: currentProfile.avatar_url,
              }, { onConflict: 'primary_user_id,linked_user_id' });
              
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
        
        // Navigate directly - no forced security question
        navigate('/');
      }
    };
    
    linkAccountIfNeeded();
  }, [user, navigate, pendingReferral, processReferral]);

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

      // Phone is optional - only validate if provided
      if (phoneNumber && phoneNumber.trim().length > 0) {
        try {
          z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format').parse(phoneNumber);
        } catch (e: any) {
          newErrors.phone = e.errors[0].message;
        }
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
    // Use secure RPC function to find user email by identifier
    const { data, error } = await supabase.rpc('find_user_email_by_identifier', {
      identifier: identifier.trim()
    });
    
    if (error) {
      console.error('Error finding user:', error);
      return null;
    }
    
    return data;
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

    if (!verificationPassword || verificationPassword.length < 6) {
      toast({
        title: 'Password required',
        description: 'Please re-enter your password to complete verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Pass the password fresh - it's not stored in React state for security
      const { error } = await verifyEmail(verificationCode, verificationPassword);
      if (error) {
        toast({
          title: 'Verification failed',
          description: error.message || 'Invalid or expired verification code.',
          variant: 'destructive',
        });
      } else {
        // Clear password from memory immediately after successful verification
        setVerificationPassword('');
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
    setVerificationPassword(''); // Clear password when going back
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

                  {/* Password re-entry for security - password is NOT stored in React state */}
                  <div className="space-y-1.5">
                    <Label htmlFor="verificationPassword" className="text-sm font-medium text-foreground/80">
                      Re-enter your password
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      For security, please re-enter your password to complete signup
                    </p>
                    <div className="relative">
                      <Input
                        id="verificationPassword"
                        type={showVerificationPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={verificationPassword}
                        onChange={(e) => setVerificationPassword(e.target.value)}
                        className="liquid-glass-input h-12 rounded-xl px-4 pr-10 text-base placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showVerificationPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="w-full h-12 rounded-xl liquid-glass-button text-white font-medium text-base relative overflow-hidden group"
                    disabled={isLoading || verificationCode.length !== 6 || verificationPassword.length < 6}
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
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/50">
            <span>© 2026 Novagram</span>
            <span>•</span>
            <span>Created by <span className="text-foreground/60">Sampath</span></span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a 
              href="https://www.instagram.com/_exotic_sampath.56" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              _exotic_sampath.56
            </a>
            <a 
              href="https://github.com/Sampath0411" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Sampath0411
            </a>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ForgotPasswordSheet 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  );
};

export default Auth;