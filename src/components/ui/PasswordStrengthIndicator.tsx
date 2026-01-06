import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const analysis = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let color = 'bg-destructive';
    
    if (passedChecks >= 4) {
      strength = 'strong';
      color = 'bg-green-500';
    } else if (passedChecks >= 2) {
      strength = 'medium';
      color = 'bg-yellow-500';
    }

    return { checks, passedChecks, strength, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bars */}
      <div className="flex gap-1.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              level <= (analysis.strength === 'strong' ? 3 : analysis.strength === 'medium' ? 2 : 1)
                ? analysis.color
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs font-medium capitalize',
          analysis.strength === 'strong' && 'text-green-500',
          analysis.strength === 'medium' && 'text-yellow-500',
          analysis.strength === 'weak' && 'text-destructive'
        )}>
          {analysis.strength} password
        </span>
        <span className="text-xs text-muted-foreground">
          {analysis.passedChecks}/5 requirements
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <RequirementItem met={analysis.checks.length} text="At least 8 characters" />
        <RequirementItem met={analysis.checks.lowercase} text="Lowercase letter" />
        <RequirementItem met={analysis.checks.uppercase} text="Uppercase letter" />
        <RequirementItem met={analysis.checks.number} text="Number" />
        <RequirementItem met={analysis.checks.special} text="Special character" />
      </div>
    </div>
  );
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={cn(
    'flex items-center gap-2 text-xs transition-colors',
    met ? 'text-green-500' : 'text-muted-foreground'
  )}>
    {met ? (
      <Check className="w-3.5 h-3.5" />
    ) : (
      <X className="w-3.5 h-3.5" />
    )}
    {text}
  </div>
);
