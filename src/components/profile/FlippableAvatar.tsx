import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface FlippableAvatarProps {
  photoUrl: string | null;
  avatarUrl: string | null;
  username: string;
  hasActiveStory: boolean;
  size?: 'profile' | 'small';
  onPhotoClick?: () => void;
}

const FlippableAvatar = ({
  photoUrl,
  avatarUrl,
  username,
  hasActiveStory,
  size = 'profile',
  onPhotoClick,
}: FlippableAvatarProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (avatarUrl) {
      setIsFlipped(prev => !prev);
    } else {
      onPhotoClick?.();
    }
  };

  const sizeClass = size === 'profile' ? 'w-24 h-24 md:w-36 md:h-36' : 'w-16 h-16';

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative rounded-full transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer",
        hasActiveStory
          ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]"
          : "p-0"
      )}
      style={{ perspective: '600px' }}
    >
      <div className={cn(hasActiveStory ? "bg-background p-[2px] rounded-full" : "")}>
        <div
          className={cn(
            sizeClass,
            "relative rounded-full transition-all duration-700"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - Profile Photo */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Avatar className={cn(sizeClass)}>
              <AvatarImage src={photoUrl || ''} alt={username} className="object-cover" />
              <AvatarFallback className="text-2xl bg-secondary">
                {username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Back - 3D Avatar */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <Avatar className={cn(sizeClass)}>
              <AvatarImage src={avatarUrl || ''} alt={`${username}'s avatar`} className="object-cover" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                🎭
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Flip indicator */}
      {avatarUrl && (
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all duration-300",
          "bg-primary/90 text-primary-foreground backdrop-blur-sm"
        )}>
          {isFlipped ? '📷' : '🎭'}
        </div>
      )}
    </button>
  );
};

export default FlippableAvatar;
