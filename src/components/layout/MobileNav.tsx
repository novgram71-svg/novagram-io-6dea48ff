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
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="bg-card/80 backdrop-blur-2xl border border-border/40 rounded-full shadow-xl px-1.5 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center justify-center p-2 rounded-full transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
              </Link>
            );
          })}

          {/* Profile */}
          <Link
            to={user ? '/profile' : '/auth'}
            className={cn(
              'flex items-center justify-center p-2 rounded-full transition-colors duration-200',
              location.pathname === '/profile' || location.pathname === '/auth'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {user && profile ? (
              <Avatar className={cn(
                "w-[22px] h-[22px]",
                location.pathname === '/profile' && 'ring-[1.5px] ring-primary'
              )}>
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="text-[7px] bg-primary/20">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-[22px] h-[22px]" strokeWidth={1.8} />
            )}
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'flex items-center justify-center p-2 rounded-full transition-colors duration-200',
                location.pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Shield className="w-[22px] h-[22px]" strokeWidth={location.pathname === '/admin' ? 2.5 : 1.8} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
