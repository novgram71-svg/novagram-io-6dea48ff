import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MissingInfoDialogProps {
  open: boolean;
  missingPhone: boolean;
  missingSecurityQuestion: boolean;
  onComplete: () => void;
}

export const MissingInfoDialog = ({
  open,
  missingPhone,
  missingSecurityQuestion,
  onComplete,
}: MissingInfoDialogProps) => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'security'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [question, setQuestion] = useState("What is your father's phone number?");
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Please enter your phone number', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();

      if (missingSecurityQuestion) {
        setStep('security');
      } else {
        toast({ title: 'Phone number saved!' });
        onComplete();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const answerHash = btoa(answer.toLowerCase().trim());
      
      const { error } = await supabase
        .from('security_questions')
        .insert({
          user_id: user?.id,
          question: question.trim(),
          answer_hash: answerHash,
          is_locked: true,
        });

      if (error) throw error;

      toast({ title: 'Security question saved!' });
      onComplete();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const showPhoneStep = missingPhone && step === 'phone';
  const showSecurityStep = !missingPhone || step === 'security';

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showPhoneStep ? (
              <>
                <Phone className="w-5 h-5 text-primary" />
                Add Phone Number
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-primary" />
                Security Question
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showPhoneStep
              ? 'For security purposes, please add your phone number to your account.'
              : 'Set up a security question to help recover your account if needed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {showPhoneStep ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="nova-input"
                />
              </div>
              <Button
                onClick={handlePhoneSubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {missingSecurityQuestion ? 'Continue' : 'Save'}
              </Button>
            </>
          ) : showSecurityStep && missingSecurityQuestion ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="question">Security Question</Label>
                <Input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your security question"
                  className="nova-input"
                />
                <p className="text-xs text-muted-foreground">
                  You can customize this question, but you won't be able to change it later.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secAnswer">Your Answer</Label>
                <Input
                  id="secAnswer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="nova-input"
                />
                <p className="text-xs text-destructive">
                  Important: You cannot change this answer later!
                </p>
              </div>
              <Button
                onClick={handleSecuritySubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save & Continue
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
