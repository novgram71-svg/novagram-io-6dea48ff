import { Home, Search, PlusSquare, MessageCircle, User, Heart, LogOut, Shield, Compass } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: Compass, path: '/explore', label: 'Explore' },
  { icon: PlusSquare, path: '/create', label: 'Create' },
  { icon: MessageCircle, path: '/messages', label: 'Messages' },
  { icon: Heart, path: '/notifications', label: 'Notifications' },
  { icon: User, path: '/profile', label: 'Profile' },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-4 py-6 group">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
                    'nova-nav-item transition-all duration-200 hover:scale-[1.02]',
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
          
          {/* Admin Link */}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={cn(
                  'nova-nav-item transition-all duration-200 hover:scale-[1.02]',
                  location.pathname === '/admin' && 'nova-nav-item-active'
                )}
              >
                <Shield 
                  className="w-6 h-6 text-primary" 
                  fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
                />
                <span className="font-medium text-primary">Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t border-sidebar-border pt-4">
        {user && profile ? (
          <>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sidebar-accent transition-all duration-200 hover:scale-[1.01]"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile.username}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-2 mt-2 px-2">
              <button 
                onClick={handleSignOut}
                className="nova-nav-item flex-1 justify-center text-destructive hover:text-destructive transition-all duration-200 hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          <Link 
            to="/auth" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02]"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
