import { cn } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NovaBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const NovaBadge = ({ size = 'sm', className, showTooltip = true }: NovaBadgeProps) => {
  const badge = (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center',
        'animate-nova-badge',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-sm opacity-60 animate-pulse" 
           style={{ transform: 'scale(1.2)' }} />
      <BadgeCheck 
        className={cn(
          sizeClasses[size],
          'text-primary fill-primary/20 relative z-10 drop-shadow-[0_0_4px_hsl(var(--primary))]'
        )} 
      />
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          className="bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground border-none"
        >
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4" />
            <span className="font-medium">Nova Verified</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NovaBadge;
