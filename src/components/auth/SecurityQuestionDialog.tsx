import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { useSecurityQuestion } from '@/hooks/useSecurityQuestion';
import { useToast } from '@/hooks/use-toast';

interface SecurityQuestionDialogProps {
  open: boolean;
  onComplete: () => void;
}

export const SecurityQuestionDialog = ({ open, onComplete }: SecurityQuestionDialogProps) => {
  const [question, setQuestion] = useState("What is your father's phone number?");
  const [answer, setAnswer] = useState('');
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const { saveSecurityQuestion } = useSecurityQuestion();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: 'Answer required',
        description: 'Please provide an answer to the security question.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveSecurityQuestion.mutateAsync({ question, answer });
      toast({
        title: 'Security question saved',
        description: 'Your security question has been set. You cannot change it after this.',
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save security question.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md animate-scale-in" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Setup
          </DialogTitle>
          <DialogDescription>
            This is for your account security. Set up a security question for password recovery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Important Notice</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once submitted, you cannot change your security question or answer. 
                  This will be used to verify your identity for password recovery.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-slide-up">
            <Label>Security Question</Label>
            {isCustomQuestion ? (
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your custom question"
                className="nova-input"
              />
            ) : (
              <div className="p-3 bg-secondary rounded-lg text-sm">
                {question}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomQuestion(!isCustomQuestion)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isCustomQuestion ? 'Use default question' : 'Use custom question'}
            </Button>
          </div>

          <div className="space-y-2 animate-slide-up stagger-1">
            <Label htmlFor="answer">Your Answer</Label>
            <Input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="nova-input"
            />
            <p className="text-xs text-muted-foreground">
              Remember this answer exactly as you type it.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saveSecurityQuestion.isPending || !answer.trim()}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 animate-slide-up stagger-2"
          >
            {saveSecurityQuestion.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Save Security Question
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
