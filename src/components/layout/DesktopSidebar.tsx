import { Home, Search, PlusSquare, MessageCircle, User, Heart, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { currentUser } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: PlusSquare, path: '/create', label: 'Create' },
  { icon: MessageCircle, path: '/messages', label: 'Messages' },
  { icon: Heart, path: '/notifications', label: 'Notifications' },
  { icon: User, path: '/profile', label: 'Profile' },
];

const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-4 py-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">N</span>
        </div>
        <h1 className="text-xl font-bold gradient-text">Novagram</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'nova-nav-item',
                    isActive && 'nova-nav-item-active'
                  )}
                >
                  <Icon 
                    className="w-6 h-6" 
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <Link 
          to="/profile" 
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sidebar-accent transition-colors"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={currentUser.profilePhoto} alt={currentUser.username} />
            <AvatarFallback>{currentUser.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentUser.username}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 mt-2 px-2">
          <button className="nova-nav-item flex-1 justify-center">
            <Settings className="w-5 h-5" />
          </button>
          <button className="nova-nav-item flex-1 justify-center text-destructive hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
