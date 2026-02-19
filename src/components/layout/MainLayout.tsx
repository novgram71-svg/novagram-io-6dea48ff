import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';
import { useStoryViewer } from '@/contexts/StoryViewerContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayoutInner = ({ children }: MainLayoutProps) => {
  const { isViewingStory } = useStoryViewer();
  const { expanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className={cn(
        'pb-20 md:pb-0 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        expanded ? 'md:ml-64' : 'md:ml-[72px]'
      )}>
        {children}
      </main>
      {!isViewingStory && <MobileNav />}
    </div>
  );
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </SidebarProvider>
  );
};

export default MainLayout;
