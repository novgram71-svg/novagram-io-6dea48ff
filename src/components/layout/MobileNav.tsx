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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-card via-card/98 to-card/90 backdrop-blur-xl border-t border-border/30 md:hidden shadow-2xl shadow-background/80">
      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="flex items-center justify-around py-2 px-2 relative">
        {navItems.map((item, index) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-500 relative group',
                isActive 
                  ? `${item.activeColor}` 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isActive && (
                <>
                  {/* Active background glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-current/20 to-transparent rounded-2xl animate-fade-in" />
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-current/20 animate-pulse-soft" />
                </>
              )}
              
              <div className="relative">
                <Icon 
                  className={cn(
                    'w-6 h-6 transition-all duration-500 relative z-10',
                    isActive ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110 group-hover:-translate-y-0.5'
                  )} 
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {/* Icon glow on active */}
                {isActive && (
                  <div className="absolute inset-0 blur-sm bg-current opacity-40 scale-150" />
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-semibold relative z-10 transition-all duration-300",
                isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
              )}>{item.label}</span>
              
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-r from-current to-current/60 animate-scale-in shadow-lg shadow-current/50" />
              )}
            </Link>
          );
        })}
        
        {/* Profile with avatar or login */}
        <Link
          to={user ? '/profile' : '/auth'}
          className={cn(
            'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-500 relative group',
            location.pathname === '/profile' || location.pathname === '/auth'
              ? 'text-amber-400' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {(location.pathname === '/profile' || location.pathname === '/auth') && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 to-transparent rounded-2xl animate-fade-in" />
              <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/20 animate-pulse-soft" />
            </>
          )}
          <div className="relative">
            {user && profile ? (
              <Avatar className={cn(
                "w-6 h-6 transition-all duration-500 relative z-10",
                (location.pathname === '/profile') 
                  ? 'ring-2 ring-amber-400 scale-110 shadow-lg shadow-amber-400/30' 
                  : 'group-hover:scale-110 group-hover:-translate-y-0.5'
              )}>
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-accent/20">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <User className={cn(
                "w-6 h-6 transition-all duration-500 relative z-10",
                (location.pathname === '/auth') ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-0.5'
              )} />
            )}
            {(location.pathname === '/profile' || location.pathname === '/auth') && (
              <div className="absolute inset-0 blur-sm bg-amber-400 opacity-40 scale-150" />
            )}
          </div>
          <span className={cn(
            "text-[10px] font-semibold relative z-10 transition-all duration-300",
            (location.pathname === '/profile' || location.pathname === '/auth') ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
          )}>{user ? 'Profile' : 'Login'}</span>
          {(location.pathname === '/profile' || location.pathname === '/auth') && (
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-400/60 animate-scale-in shadow-lg shadow-amber-400/50" />
          )}
        </Link>

        {/* Admin link for admin users */}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-500 relative group',
              location.pathname === '/admin'
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {location.pathname === '/admin' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl animate-fade-in" />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 animate-pulse-soft" />
              </>
            )}
            <div className="relative">
              <Shield 
                className={cn(
                  'w-6 h-6 transition-all duration-500 relative z-10',
                  location.pathname === '/admin' ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110 group-hover:-translate-y-0.5'
                )} 
                fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
                strokeWidth={location.pathname === '/admin' ? 2.5 : 2}
              />
              {location.pathname === '/admin' && (
                <div className="absolute inset-0 blur-sm bg-primary opacity-40 scale-150" />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-semibold relative z-10 transition-all duration-300",
              location.pathname === '/admin' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
            )}>Admin</span>
            {location.pathname === '/admin' && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-scale-in shadow-lg shadow-primary/50" />
            )}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
