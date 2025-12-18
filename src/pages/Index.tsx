import MainLayout from '@/components/layout/MainLayout';
import StoriesBar from '@/components/stories/StoriesBar';
import Feed from '@/components/posts/Feed';

const Index = () => {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold gradient-text">Novagram</h1>
          </div>
        </header>

        {/* Stories */}
        <section className="border-b border-border bg-card/50">
          <StoriesBar />
        </section>

        {/* Feed */}
        <section className="py-6">
          <Feed />
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
