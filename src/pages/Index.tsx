import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import StoriesBar from '@/components/stories/StoriesBar';
import Feed from '@/components/posts/Feed';
import PullToRefresh from '@/components/posts/PullToRefresh';
import { memo } from 'react';

// Memoize components to prevent unnecessary re-renders
const MemoizedStoriesBar = memo(StoriesBar);
const MemoizedFeed = memo(Feed);

const Index = () => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] }),
      queryClient.invalidateQueries({ queryKey: ['stories'] }),
    ]);
  };

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-2xl mx-auto">
          <MobileHeader />

          {/* Stories */}
          <section className="border-b border-border bg-card/50">
            <MemoizedStoriesBar />
          </section>

          {/* Feed */}
          <section className="py-6">
            <MemoizedFeed />
          </section>
        </div>
      </PullToRefresh>
    </MainLayout>
  );
};

export default Index;
