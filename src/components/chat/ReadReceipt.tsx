import { forwardRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadReceiptProps {
  sent: boolean;
  read: boolean;
  readAt?: string | null;
  className?: string;
  animate?: boolean;
}

const ReadReceipt = forwardRef<HTMLDivElement, ReadReceiptProps>(
  ({ sent, read, readAt, className, animate = true }, ref) => {
    if (!sent) return null;

    return (
      <div 
        ref={ref} 
        className={cn(
          "inline-flex items-center transition-all duration-300",
          animate && "animate-receipt-appear",
          className
        )}
      >
        {read ? (
          <div className="relative">
            <CheckCheck 
              className={cn(
                "w-3.5 h-3.5 text-blue-500 transition-all duration-500",
                animate && "animate-receipt-read"
              )} 
            />
            {/* Glow effect on read */}
            <div className="absolute inset-0 w-3.5 h-3.5 bg-blue-500/30 blur-sm rounded-full animate-pulse-soft" />
          </div>
        ) : (
          <div className="relative">
            <Check 
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-all duration-300",
                animate && "animate-receipt-sent"
              )} 
            />
          </div>
        )}
      </div>
    );
  }
);

ReadReceipt.displayName = 'ReadReceipt';

export default ReadReceipt;
