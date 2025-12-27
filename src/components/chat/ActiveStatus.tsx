import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActiveStatusProps {
  isOnline: boolean;
  lastSeen: string | null;
  showDot?: boolean;
  className?: string;
}

const ActiveStatus = ({ isOnline, lastSeen, showDot = false, className }: ActiveStatusProps) => {
  const getStatusText = () => {
    if (isOnline) return 'Active now';
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Active just now';
      if (diffMins < 60) return `Active ${diffMins}m ago`;
      return `Active ${formatDistanceToNow(lastSeenDate)} ago`;
    }
    return 'Offline';
  };

  if (showDot) {
    return (
      <div 
        className={cn(
          "w-3 h-3 rounded-full border-2 border-background",
          isOnline ? "bg-green-500" : "bg-muted",
          className
        )}
      />
    );
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {getStatusText()}
    </span>
  );
};

export default ActiveStatus;
