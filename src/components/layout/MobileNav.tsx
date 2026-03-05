import { Home, Search, PlusSquare, MessageCircle, User, Shield, Compass } from 'lucide-react';
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
    { icon: Compass, path: '/explore', label: 'Explore' },
    { icon: PlusSquare, path: '/create', label: 'Create' },
    { icon: MessageCircle, path: '/messages', label: 'Messages' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-card/80 backdrop-blur-2xl border border-border/40 rounded-[2rem] shadow-2xl shadow-background/60 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2.5 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon
                  className="w-5.5 h-5.5"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Profile */}
          <Link
            to={user ? '/profile' : '/auth'}
            className={cn(
              'flex flex-col items-center gap-0.5 p-2.5 rounded-2xl transition-all duration-300',
              location.pathname === '/profile' || location.pathname === '/auth'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {user && profile ? (
              <Avatar className={cn(
                "w-5.5 h-5.5",
                (location.pathname === '/profile') && 'ring-1.5 ring-primary'
              )}>
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="text-[8px] bg-primary/20">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-5.5 h-5.5" strokeWidth={1.8} />
            )}
            <span className="text-[9px] font-medium">{user ? 'Profile' : 'Login'}</span>
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'flex flex-col items-center gap-0.5 p-2.5 rounded-2xl transition-all duration-300',
                location.pathname === '/admin'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Shield className="w-5.5 h-5.5" strokeWidth={location.pathname === '/admin' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
