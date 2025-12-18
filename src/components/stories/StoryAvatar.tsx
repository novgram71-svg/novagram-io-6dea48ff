import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';

interface StoryAvatarProps {
  imageUrl: string;
  username: string;
  isOwn?: boolean;
  isViewed?: boolean;
  hasStory?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const StoryAvatar = ({
  imageUrl,
  username,
  isOwn = false,
  isViewed = false,
  hasStory = true,
  onClick,
  size = 'md',
}: StoryAvatarProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className={cn(
          'relative rounded-full p-[2px] transition-all duration-200',
          hasStory && !isViewed && 'story-ring',
          hasStory && isViewed && 'story-ring-viewed',
          !hasStory && 'bg-border',
          'group-hover:scale-105'
        )}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
          <AvatarImage src={imageUrl} alt={username} className="object-cover" />
          <AvatarFallback className="bg-secondary text-foreground">
            {username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <span className={cn(
        'text-xs font-medium truncate max-w-16 text-center',
        isViewed ? 'text-muted-foreground' : 'text-foreground'
      )}>
        {isOwn ? 'Your Story' : username}
      </span>
    </button>
  );
};

export default StoryAvatar;
