import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default MainLayout;
