import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: PlusSquare, path: '/create', label: 'Create' },
  { icon: MessageCircle, path: '/messages', label: 'Messages' },
  { icon: User, path: '/profile', label: 'Profile' },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 transition-all duration-200',
                  isActive && 'scale-110'
                )} 
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
