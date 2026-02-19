import { Home, Search, PlusSquare, MessageCircle, User, Heart, LogOut, Shield, Compass } from 'lucide-react';
import Logo3D from '@/components/ui/Logo3D';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';

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
  const { expanded, setExpanded } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  const isItemActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border backdrop-blur-xl z-50 overflow-hidden',
          'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          expanded ? 'w-64' : 'w-[72px]'
        )}
      >
        {/* Logo */}
        <Link to="/" className={cn(
          'flex items-center px-4 py-6 overflow-hidden transition-all duration-300',
          expanded ? 'justify-start' : 'justify-center'
        )}>
          {expanded ? (
            <Logo3D size="md" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
              <span className="text-sm font-black text-primary-foreground">G</span>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 mt-2 px-2">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = isItemActive(item.path);
              const Icon = item.icon;

              return (
                <li key={item.path} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up opacity-0 [animation-fill-mode:forwards]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden',
                          'hover:bg-sidebar-accent/50',
                          isActive && 'bg-gradient-to-r from-primary/10 to-accent/5'
                        )}
                      >
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5 opacity-0 transition-opacity duration-300 rounded-xl",
                          isActive && "opacity-100"
                        )} />
                        <Icon
                          className={cn(
                            'w-6 h-6 transition-all duration-300 relative z-10 group-hover:scale-110 flex-shrink-0',
                            isActive ? item.activeColor : 'text-muted-foreground group-hover:text-foreground'
                          )}
                          fill={isActive ? 'currentColor' : 'none'}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className={cn(
                          "font-medium relative z-10 transition-all duration-300 whitespace-nowrap",
                          isActive ? item.activeColor : 'text-foreground/80',
                          expanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0 overflow-hidden'
                        )}>
                          {item.label}
                        </span>
                        {isActive && expanded && (
                          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft ml-auto z-10" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!expanded && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}

            {/* Admin Link */}
            {isAdmin && (
              <li className="animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '350ms' }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/admin"
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden',
                        'hover:bg-sidebar-accent/50',
                        location.pathname === '/admin' && 'bg-gradient-to-r from-primary/20 to-accent/10'
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10 opacity-0 transition-opacity duration-300 rounded-xl",
                        location.pathname === '/admin' && "opacity-100"
                      )} />
                      <Shield
                        className={cn(
                          'w-6 h-6 transition-all duration-300 relative z-10 group-hover:scale-110 flex-shrink-0',
                          location.pathname === '/admin' ? 'text-primary' : 'text-primary/70 group-hover:text-primary'
                        )}
                        fill={location.pathname === '/admin' ? 'currentColor' : 'none'}
                      />
                      <span className={cn(
                        "font-medium relative z-10 transition-all duration-300 whitespace-nowrap",
                        location.pathname === '/admin' ? 'text-primary' : 'text-primary/70 group-hover:text-primary',
                        expanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0 overflow-hidden'
                      )}>
                        Admin
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {!expanded && (
                    <TooltipContent side="right" className="font-medium">
                      Admin
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            )}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="mt-auto border-t border-sidebar-border pt-4 px-2 pb-4">
          {user && profile ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/profile"
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-300 group overflow-hidden'
                    )}
                  >
                    <Avatar className="w-9 h-9 ring-2 ring-offset-2 ring-offset-sidebar ring-primary/30 transition-all duration-300 group-hover:ring-primary flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-sm">{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'flex-1 min-w-0 transition-all duration-300',
                      expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    )}>
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{profile?.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    </div>
                  </Link>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right">{profile?.username || 'Profile'}</TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300 group mt-1',
                      !expanded && 'justify-center'
                    )}
                  >
                    <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 flex-shrink-0" />
                    <span className={cn(
                      "text-sm font-medium transition-all duration-300 whitespace-nowrap",
                      expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    )}>
                      Sign Out
                    </span>
                  </button>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right">Sign Out</TooltipContent>
                )}
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/auth"
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]',
                    !expanded && 'justify-center'
                  )}
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium transition-all duration-300 whitespace-nowrap",
                    expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                  )}>
                    Sign In
                  </span>
                </Link>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">Sign In</TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DesktopSidebar;
