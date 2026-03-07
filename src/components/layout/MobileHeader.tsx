import { Link } from 'react-router-dom';
import { Heart, Send } from 'lucide-react';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import Logo3D from '@/components/ui/Logo3D';

const MobileHeader = () => {
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <header className="sticky top-0 z-40 glass-header md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/">
          <Logo3D size="sm" />
        </Link>
        
        {user && (
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative">
              <Heart className="w-6 h-6 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/messages">
              <Send className="w-6 h-6 text-foreground" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
