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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/[0.04] blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/[0.04] blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>
      <DesktopSidebar />
      <main className={cn(
        'pb-24 md:pb-0 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
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
