import { useState } from 'react';
import { Send, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSendStoryReply, useStoryLike, useToggleStoryLike } from '@/hooks/useStoryReplies';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StoryReplyInputProps {
  storyId: string;
  storyOwnerId: string;
  isOwnStory: boolean;
}

const StoryReplyInput = ({ storyId, storyOwnerId, isOwnStory }: StoryReplyInputProps) => {
  const [message, setMessage] = useState('');
  const sendReply = useSendStoryReply();
  const { data: isLiked } = useStoryLike(storyId);
  const toggleLike = useToggleStoryLike();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendReply.mutateAsync({
        storyId,
        content: message.trim(),
        storyOwnerId,
      });
      setMessage('');
      toast.success('Reply sent!');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleLike = async () => {
    try {
      await toggleLike.mutateAsync({
        storyId,
        storyOwnerId,
        isLiked: isLiked || false,
      });
    } catch (error) {
      toast.error('Failed to like story');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't show reply input for own stories
  if (isOwnStory) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 animate-slide-up">
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="bg-background/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 pr-12 rounded-full"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSend}
          disabled={!message.trim() || sendReply.isPending}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/20 rounded-full"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={handleLike}
        disabled={toggleLike.isPending}
        className="text-white hover:bg-white/20 rounded-full shrink-0 transition-all duration-200 active:scale-90"
      >
        <Heart 
          className={cn(
            "w-6 h-6 transition-all duration-200",
            isLiked && "fill-red-500 text-red-500 animate-heart-beat"
          )} 
        />
      </Button>
    </div>
  );
};

export default StoryReplyInput;
