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
    { icon: Home, path: '/', label: 'Home', activeColor: 'text-primary' },
    { icon: Compass, path: '/explore', label: 'Explore', activeColor: 'text-emerald-400' },
    { icon: PlusSquare, path: '/create', label: 'Create', activeColor: 'text-violet-400' },
    { icon: MessageCircle, path: '/messages', label: 'Messages', activeColor: 'text-pink-400' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-card via-card/98 to-card/95 backdrop-blur-xl border-t border-border/50 md:hidden shadow-lg shadow-background/50">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative group',
                isActive 
                  ? `${item.activeColor}` 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-xl animate-fade-in" />
              )}
              <Icon 
                className={cn(
                  'w-6 h-6 transition-all duration-300 relative z-10',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )} 
                fill={isActive ? 'currentColor' : 'none'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-xs font-medium relative z-10 transition-all duration-300",
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
              )}>{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current animate-pulse-soft" />
              )}
            </Link>
          );
        })}
        
        {/* Profile with avatar or login */}
        <Link
          to={user ? '/profile' : '/auth'}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative group',
            location.pathname === '/profile' || location.pathname === '/auth'
              ? 'text-amber-400' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {(location.pathname === '/profile' || location.pathname === '/auth') && (
            <div className="absolute inset-0 bg-gradient-to-t from-amber-400/10 to-transparent rounded-xl animate-fade-in" />
          )}
          {user && profile ? (
            <Avatar className={cn(
              "w-6 h-6 transition-all duration-300 relative z-10",
              (location.pathname === '/profile') 
                ? 'ring-2 ring-amber-400 scale-110' 
                : 'group-hover:scale-110'
            )}>
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <User className={cn(
              "w-6 h-6 transition-all duration-300 relative z-10",
              (location.pathname === '/auth') ? 'scale-110' : 'group-hover:scale-110'
            )} />
          )}
          <span className={cn(
            "text-xs font-medium relative z-10 transition-all duration-300",
            (location.pathname === '/profile' || location.pathname === '/auth') ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
          )}>{user ? 'Profile' : 'Login'}</span>
        </Link>

        {/* Admin link for admin users */}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative group',
              location.pathname === '/admin'
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {location.pathname === '/admin' && (
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-xl animate-fade-in" />
            )}
            <Shield 
              className={cn(
                'w-6 h-6 transition-all duration-300 relative z-10',
                location.pathname === '/admin' ? 'scale-110' : 'group-hover:scale-110'
              )} 
              fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
              strokeWidth={location.pathname === '/admin' ? 2.5 : 2}
            />
            <span className={cn(
              "text-xs font-medium relative z-10 transition-all duration-300",
              location.pathname === '/admin' ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
            )}>Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
