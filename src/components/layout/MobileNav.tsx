import { Home, Search, PlusSquare, MessageCircle, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MobileNav = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: PlusSquare, path: '/create', label: 'Create' },
    { icon: MessageCircle, path: '/messages', label: 'Messages' },
  ];

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
        
        {/* Profile with avatar or login */}
        <Link
          to={user ? '/profile' : '/auth'}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
            location.pathname === '/profile' || location.pathname === '/auth'
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {user && profile ? (
            <Avatar className="w-6 h-6">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-xs">{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="w-6 h-6" />
          )}
          <span className="text-xs font-medium">{user ? 'Profile' : 'Login'}</span>
        </Link>

        {/* Admin link for admin users */}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
              location.pathname === '/admin'
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield 
              className={cn(
                'w-6 h-6 transition-all duration-200',
                location.pathname === '/admin' && 'scale-110'
              )} 
              fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
            />
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
