import { X, Mic } from 'lucide-react';
import { MessageWithProfile } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  message: MessageWithProfile;
  onCancel: () => void;
  isOwn?: boolean;
}

const ReplyPreview = ({ message, onCancel, isOwn }: ReplyPreviewProps) => {
  const getPreviewContent = () => {
    if ((message as any).voice_url) {
      return (
        <span className="flex items-center gap-1">
          <Mic className="w-3 h-3" />
          Voice message
        </span>
      );
    }
    if (message.image_url) {
      return '📷 Photo';
    }
    if (message.file_url) {
      return `📎 ${message.file_name || 'File'}`;
    }
    return message.content;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-t-lg border-l-2 border-primary bg-secondary/50",
      "animate-slide-up"
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Replying to {isOwn ? 'yourself' : message.sender.username}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {getPreviewContent()}
        </p>
      </div>
      <button 
        onClick={onCancel}
        className="p-1 hover:bg-secondary rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ReplyPreview;