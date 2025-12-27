import MainLayout from '@/components/layout/MainLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import StoriesBar from '@/components/stories/StoriesBar';
import Feed from '@/components/posts/Feed';
import HelpCenter from '@/components/HelpCenter';

const Index = () => {
  return (
    <MainLayout>
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
      
      {/* Floating Help Button */}
      <HelpCenter />
    </MainLayout>
  );
};

export default Index;
