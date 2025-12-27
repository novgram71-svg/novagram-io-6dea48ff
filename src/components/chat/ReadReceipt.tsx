import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadReceiptProps {
  sent: boolean;
  read: boolean;
  readAt?: string | null;
  className?: string;
}

const ReadReceipt = ({ sent, read, readAt, className }: ReadReceiptProps) => {
  if (!sent) return null;

  return (
    <div className={cn("inline-flex items-center", className)}>
      {read ? (
        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
      ) : (
        <Check className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </div>
  );
};

export default ReadReceipt;
