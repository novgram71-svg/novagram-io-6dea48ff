import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send } from 'lucide-react';
import { Story } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
}

const StoryViewer = ({ story, onClose }: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const isOwn = story.userId === 'current';

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onClose();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-card/80 text-foreground hover:bg-card transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows (Desktop) */}
      <button className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/80 text-foreground hover:bg-card transition-colors">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/80 text-foreground hover:bg-card transition-colors">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Container */}
      <div className="relative w-full max-w-md h-[85vh] max-h-[800px] mx-4 rounded-2xl overflow-hidden bg-card animate-scale-in">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2">
          <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-foreground/20">
              <AvatarImage src={story.user.profilePhoto} alt={story.user.username} />
              <AvatarFallback>{story.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-foreground">{story.user.username}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Story Image */}
        <img
          src={story.imageUrl}
          alt="Story"
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          {isOwn ? (
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
            >
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">{story.views.length} viewers</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Send a message..."
                className="flex-1 bg-foreground/10 border-foreground/20 text-foreground placeholder:text-foreground/50"
              />
              <Button size="icon" variant="ghost" className="text-foreground">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Viewers List (for own stories) */}
        {isOwn && showViewers && (
          <div className="absolute bottom-20 left-0 right-0 z-30 mx-4 p-4 bg-card rounded-xl border border-border max-h-60 overflow-y-auto animate-fade-in">
            <h4 className="font-semibold mb-3">Story Views</h4>
            {story.views.length > 0 ? (
              <ul className="space-y-3">
                {story.views.map((view) => (
                  <li key={view.userId} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={view.user.profilePhoto} alt={view.user.username} />
                      <AvatarFallback>{view.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{view.user.username}</p>
                      <p className="text-xs text-muted-foreground">{view.viewedAt}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No viewers yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
