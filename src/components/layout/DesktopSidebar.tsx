import { Home, Search, PlusSquare, MessageCircle, User, Heart, LogOut, Shield, Compass } from 'lucide-react';
import Logo3D from '@/components/ui/Logo3D';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Home, path: '/', label: 'Home', activeColor: 'text-primary' },
  { icon: Search, path: '/search', label: 'Search', activeColor: 'text-blue-400' },
  { icon: Compass, path: '/explore', label: 'Explore', activeColor: 'text-emerald-400' },
  { icon: PlusSquare, path: '/create', label: 'Create', activeColor: 'text-violet-400' },
  { icon: MessageCircle, path: '/messages', label: 'Messages', activeColor: 'text-pink-400' },
  { icon: Heart, path: '/notifications', label: 'Notifications', activeColor: 'text-red-400' },
  { icon: User, path: '/profile', label: 'Profile', activeColor: 'text-amber-400' },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border p-4 backdrop-blur-xl">
      {/* 3D Logo */}
      <Link to="/" className="px-4 py-6">
        <Logo3D size="md" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up opacity-0 [animation-fill-mode:forwards]">
                <Link
                  to={item.path}
                  className={cn(
                    'nova-nav-item transition-all duration-300 group relative overflow-hidden',
                    isActive && 'nova-nav-item-active'
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5 opacity-0 transition-opacity duration-300",
                    isActive && "opacity-100"
                  )} />
                  <Icon 
                    className={cn(
                      'w-6 h-6 transition-all duration-300 relative z-10 group-hover:scale-110',
                      isActive ? item.activeColor : 'group-hover:text-primary'
                    )}
                    fill={isActive ? 'currentColor' : 'none'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn(
                    "font-medium relative z-10 transition-colors duration-300",
                    isActive && item.activeColor
                  )}>{item.label}</span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* Admin Link */}
          {isAdmin && (
            <li className="animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '350ms' }}>
              <Link
                to="/admin"
                className={cn(
                  'nova-nav-item transition-all duration-300 group relative overflow-hidden',
                  location.pathname === '/admin' && 'nova-nav-item-active'
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10 opacity-0 transition-opacity duration-300",
                  location.pathname === '/admin' && "opacity-100"
                )} />
                <Shield 
                  className={cn(
                    'w-6 h-6 transition-all duration-300 relative z-10 group-hover:scale-110',
                    location.pathname === '/admin' ? 'text-primary' : 'text-primary/70 group-hover:text-primary'
                  )}
                  fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
                />
                <span className={cn(
                  "font-medium relative z-10 transition-colors duration-300",
                  location.pathname === '/admin' ? 'text-primary' : 'text-primary/70 group-hover:text-primary'
                )}>Admin</span>
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-sidebar-accent hover:to-sidebar-accent/50 transition-all duration-300 group"
            >
              <Avatar className="w-10 h-10 ring-2 ring-offset-2 ring-offset-sidebar ring-primary/30 transition-all duration-300 group-hover:ring-primary">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{profile.username}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-2 mt-2 px-2">
              <button 
                onClick={handleSignOut}
                className="nova-nav-item flex-1 justify-center text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          <Link 
            to="/auth" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
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
