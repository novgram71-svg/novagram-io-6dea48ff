import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useStories, StoryWithUser } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import StoryAvatar from './StoryAvatar';
import StoryViewer from './StoryViewer';
import CreateStoryDialog from './CreateStoryDialog';
import { Skeleton } from '@/components/ui/skeleton';

const StoriesBar = () => {
  const { data: stories, isLoading } = useStories();
  const { user, profile } = useAuth();
  const [selectedStory, setSelectedStory] = useState<StoryWithUser | null>(null);

  // Group stories by user
  const groupedStories = useMemo(() => {
    if (!stories) return [];
    
    const userStoriesMap = new Map<string, StoryWithUser[]>();
    
    stories.forEach(story => {
      const existing = userStoriesMap.get(story.user_id) || [];
      userStoriesMap.set(story.user_id, [...existing, story]);
    });
    
    return Array.from(userStoriesMap.entries()).map(([userId, userStories]) => ({
      userId,
      username: userStories[0].profiles.username,
      avatar: userStories[0].profiles.avatar_url,
      stories: userStories,
    }));
  }, [stories]);

  const handleStoryClick = (story: StoryWithUser) => {
    setSelectedStory(story);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-4 min-w-max">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentUserStories = groupedStories.find(g => g.userId === user?.id);
  const otherStories = groupedStories.filter(g => g.userId !== user?.id);

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-4 min-w-max">
          {/* Current User Story Slot */}
          {user && profile && (
            currentUserStories ? (
              <StoryAvatar
                imageUrl={profile.avatar_url || ''}
                username="Your story"
                isOwn={true}
                hasStory={true}
                onClick={() => handleStoryClick(currentUserStories.stories[0])}
              />
            ) : (
              <CreateStoryDialog>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="relative w-16 h-16">
                    <div className="w-full h-full rounded-full bg-secondary border-2 border-dashed border-border group-hover:border-primary transition-colors overflow-hidden">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Your story" 
                          className="w-full h-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {profile.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    Add story
                  </span>
                </button>
              </CreateStoryDialog>
            )
          )}

          {/* Other Stories */}
          {otherStories.map((userStories) => (
            <StoryAvatar
              key={userStories.userId}
              imageUrl={userStories.avatar || ''}
              username={userStories.username}
              onClick={() => handleStoryClick(userStories.stories[0])}
            />
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
};

export default StoriesBar;
