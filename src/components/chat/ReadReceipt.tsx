import { forwardRef, useState } from 'react';
import { Check, CheckCheck, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface ReadReceiptProps {
  status: DeliveryStatus;
  readAt?: string | null;
  sentAt?: string;
  className?: string;
  animate?: boolean;
}

const ReadReceipt = forwardRef<HTMLDivElement, ReadReceiptProps>(
  ({ status, readAt, sentAt, className, animate = true }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const getStatusLabel = () => {
      switch (status) {
        case 'sending':
          return 'Sending...';
        case 'sent':
          return 'Sent';
        case 'delivered':
          return 'Delivered';
        case 'read':
          return readAt 
            ? `Seen ${format(new Date(readAt), 'MMM d, h:mm a')}` 
            : 'Seen';
        default:
          return '';
      }
    };

    const getIcon = () => {
      switch (status) {
        case 'sending':
          return (
            <div className="relative">
              <Clock 
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-all duration-300",
                  animate && "animate-pulse"
                )} 
              />
            </div>
          );
        case 'sent':
          return (
            <div className="relative">
              <Check 
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-all duration-300",
                  animate && "animate-receipt-sent"
                )} 
              />
            </div>
          );
        case 'delivered':
          return (
            <div className="relative">
              <CheckCheck 
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-all duration-300",
                  animate && "animate-receipt-delivered"
                )} 
              />
            </div>
          );
        case 'read':
          return (
            <div className="relative group">
              <CheckCheck 
                className={cn(
                  "w-3.5 h-3.5 text-blue-500 transition-all duration-500",
                  animate && "animate-receipt-read"
                )} 
              />
              {/* Glow effect on read */}
              <div className="absolute inset-0 w-3.5 h-3.5 bg-blue-500/30 blur-sm rounded-full animate-pulse-soft opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              ref={ref} 
              className={cn(
                "inline-flex items-center transition-all duration-300 cursor-default",
                animate && "animate-receipt-appear",
                className
              )}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {getIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className={cn(
              "bg-card/95 backdrop-blur-md border border-border/50 shadow-xl",
              "animate-in fade-in-0 zoom-in-95 duration-200"
            )}
          >
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-medium">{getStatusLabel()}</span>
              {status === 'read' && sentAt && (
                <span className="text-muted-foreground text-[10px]">
                  Sent {format(new Date(sentAt), 'h:mm a')}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

ReadReceipt.displayName = 'ReadReceipt';

export default ReadReceipt;
