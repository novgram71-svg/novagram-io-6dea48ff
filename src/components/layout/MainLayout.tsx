import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';
import { useStoryViewer } from '@/contexts/StoryViewerContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isViewingStory } = useStoryViewer();

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
      {!isViewingStory && <MobileNav />}
    </div>
  );
};

export default MainLayout;
