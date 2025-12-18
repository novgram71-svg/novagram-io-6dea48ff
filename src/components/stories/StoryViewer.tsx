import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { StoryWithUser, useRecordStoryView } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
  story: StoryWithUser;
  onClose: () => void;
}

const StoryViewer = ({ story, onClose }: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const recordView = useRecordStoryView();

  useEffect(() => {
    // Record story view
    if (user && story.user_id !== user.id) {
      recordView.mutate(story.id);
    }

    // Progress bar and auto-advance
    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return prev;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [story.id, onClose, user, recordView]);

  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true });
  const isOwnStory = user?.id === story.user_id;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex items-center justify-center">
        {/* Story Container */}
        <div className="relative w-full max-w-md h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden shadow-2xl">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 z-10 p-2">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-50 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary">
                <AvatarImage src={story.profiles.avatar_url || ''} alt={story.profiles.username} />
                <AvatarFallback>{story.profiles.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-white drop-shadow-lg">{story.profiles.username}</p>
                <p className="text-xs text-white/80 drop-shadow-lg">{timeAgo}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Story Image */}
          <img
            src={story.image_url}
            alt="Story"
            className="w-full h-full object-cover"
          />

          {/* Navigation Areas */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
          </button>
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
          </button>

          {/* Story Views (for own stories) */}
          {isOwnStory && (
            <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
              <button className="flex items-center gap-2 text-white/90 text-sm">
                <Eye className="w-5 h-5" />
                <span>Views</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <button
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default StoryViewer;
