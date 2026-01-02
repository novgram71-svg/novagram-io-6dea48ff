import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import StoriesBar from '@/components/stories/StoriesBar';
import Feed from '@/components/posts/Feed';
import PullToRefresh from '@/components/posts/PullToRefresh';

const Index = () => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['posts'] });
    await queryClient.invalidateQueries({ queryKey: ['stories'] });
  };

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-2xl mx-auto">
          <MobileHeader />

          {/* Stories */}
          <section className="border-b border-border bg-card/50">
            <StoriesBar />
          </section>

          {/* Feed */}
          <section className="py-6">
            <Feed />
          </section>
        </div>
      </PullToRefresh>
    </MainLayout>
  );
};

export default Index;
