import { forwardRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadReceiptProps {
  sent: boolean;
  read: boolean;
  readAt?: string | null;
  className?: string;
}

const ReadReceipt = forwardRef<HTMLDivElement, ReadReceiptProps>(
  ({ sent, read, readAt, className }, ref) => {
    if (!sent) return null;

    return (
      <div ref={ref} className={cn("inline-flex items-center", className)}>
        {read ? (
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <Check className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
    );
  }
);

ReadReceipt.displayName = 'ReadReceipt';

export default ReadReceipt;
