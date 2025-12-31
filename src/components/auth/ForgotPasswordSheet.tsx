import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordSheet = ({ open, onOpenChange }: ForgotPasswordSheetProps) => {
  const [step, setStep] = useState<'email' | 'question' | 'password' | 'pending'>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFindAccount = async () => {
    if (!email.trim()) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (error) throw error;
      if (!profile) {
        toast({ title: 'No account found with this email', variant: 'destructive' });
        return;
      }

      setUserId(profile.id);

      // Get security question
      const { data: sq, error: sqError } = await supabase
        .from('security_questions')
        .select('question')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (sqError) throw sqError;
      if (!sq) {
        toast({ 
          title: 'No security question set', 
          description: 'This account does not have a security question configured.',
          variant: 'destructive' 
        });
        return;
      }

      setSecurityQuestion(sq.question);
      setStep('question');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!answer.trim()) {
      toast({ title: 'Please enter your answer', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data: sq, error } = await supabase
        .from('security_questions')
        .select('answer_hash')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      const answerHash = btoa(answer.toLowerCase().trim());
      if (answerHash !== sq?.answer_hash) {
        toast({ title: 'Incorrect answer', description: 'Please try again.', variant: 'destructive' });
        return;
      }

      setStep('password');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Create password reset request for admin approval
      const passwordHash = btoa(newPassword); // Simple encoding for demo
      
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: userId,
          new_password_hash: passwordHash,
        });

      if (error) throw error;

      setStep('pending');
      toast({
        title: 'Request submitted',
        description: 'Your password reset request has been sent to admin for approval.',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setUserId('');
    setSecurityQuestion('');
    setAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Reset Password
          </SheetTitle>
          <SheetDescription>
            {step === 'email' && 'Enter your email to find your account'}
            {step === 'question' && 'Answer your security question'}
            {step === 'password' && 'Set your new password'}
            {step === 'pending' && 'Waiting for admin approval'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {step === 'email' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="nova-input"
                />
              </div>
              <Button
                onClick={handleFindAccount}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Find My Account
              </Button>
            </div>
          )}

          {step === 'question' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Security Question</p>
                    <p className="text-sm text-muted-foreground mt-1">{securityQuestion}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="nova-input"
                />
              </div>
              <Button
                onClick={handleVerifyAnswer}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify Answer
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="nova-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nova-input"
                />
              </div>
              <Button
                onClick={handleSubmitNewPassword}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit for Approval
              </Button>
            </div>
          )}

          {step === 'pending' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Request Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Your password reset request has been sent to the admin for approval. 
                Once approved, you can log in with your new password.
              </p>
              <Button onClick={handleClose} className="mt-6">
                Close
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
