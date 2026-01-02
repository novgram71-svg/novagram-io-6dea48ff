import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
  url: string;
  isOwn: boolean;
}

const VoiceMessage = ({ url, isOwn }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    
    audioRef.current.onloadedmetadata = () => {
      setDuration(audioRef.current?.duration || 0);
    };
    
    audioRef.current.ontimeupdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    };
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 min-w-[180px]",
      isOwn ? "flex-row" : "flex-row"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full flex-shrink-0",
          isOwn ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" : "bg-foreground/10 hover:bg-foreground/20"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </Button>
      
      <div className="flex-1 flex flex-col gap-1">
        <div className={cn(
          "h-1 rounded-full overflow-hidden",
          isOwn ? "bg-primary-foreground/30" : "bg-foreground/20"
        )}>
          <div 
            className={cn(
              "h-full transition-all duration-100",
              isOwn ? "bg-primary-foreground" : "bg-foreground/60"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn(
          "text-xs",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default VoiceMessage;