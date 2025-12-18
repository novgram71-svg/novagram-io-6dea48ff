import { useState } from 'react';
import { mockStories, currentUser } from '@/lib/mockData';
import StoryAvatar from './StoryAvatar';
import StoryViewer from './StoryViewer';
import { Story } from '@/lib/mockData';

const StoriesBar = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-4 min-w-max">
          {/* Current User Story */}
          <StoryAvatar
            imageUrl={currentUser.profilePhoto}
            username={currentUser.username}
            isOwn={true}
            hasStory={mockStories.some(s => s.userId === 'current')}
            onClick={() => {
              const ownStory = mockStories.find(s => s.userId === 'current');
              if (ownStory) handleStoryClick(ownStory);
            }}
          />

          {/* Other Stories */}
          {mockStories
            .filter(story => story.userId !== 'current')
            .map((story) => (
              <StoryAvatar
                key={story.id}
                imageUrl={story.user.profilePhoto}
                username={story.user.username}
                isViewed={story.isViewed}
                onClick={() => handleStoryClick(story)}
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
