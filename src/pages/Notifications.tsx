import { useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  follow_request: Clock,
  follow_accepted: UserCheck,
  password_reset_approved: CheckCircle,
  password_reset_rejected: XCircle,
};

const notificationColors: Record<string, string> = {
  like: 'text-red-500',
  comment: 'text-primary',
  follow: 'text-green-500',
  follow_request: 'text-yellow-500',
  follow_accepted: 'text-green-500',
  password_reset_approved: 'text-green-500',
  password_reset_rejected: 'text-red-500',
};

const notificationMessages: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  follow_request: 'requested to follow you',
  follow_accepted: 'accepted your follow request',
  password_reset_approved: 'Your password reset has been approved. You can now login with your new password.',
  password_reset_rejected: 'Your password reset request was rejected. Please try again or contact support.',
};

const Notifications = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  // Mark notifications as read when viewing
  useEffect(() => {
    if (notifications && notifications.some(n => !n.read)) {
      markRead.mutate();
    }
  }, [notifications]);

  const todayNotifications = notifications?.filter(n => {
    const date = new Date(n.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }) || [];

  const earlierNotifications = notifications?.filter(n => {
    const date = new Date(n.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  }) || [];

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
          <Heart className="w-12 h-12 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Sign in to see notifications</h2>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </header>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="w-48 h-4 mb-2" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Today */}
              {todayNotifications.length > 0 && (
                <div className="p-4">
                  <h2 className="font-semibold mb-4">Today</h2>
                  <div className="space-y-4">
                    {todayNotifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Heart;
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-fade-in hover:bg-secondary/50',
                            !notification.read && 'bg-secondary'
                          )}
                        >
                          <div className="relative">
                            <Link to={`/profile/${notification.actor?.username}`}>
                              <Avatar className="w-11 h-11 transition-transform hover:scale-105">
                                <AvatarImage src={notification.actor?.avatar_url || ''} alt={notification.actor?.username} />
                                <AvatarFallback>{notification.actor?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className={cn(
                              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center',
                              notificationColors[notification.type] || 'text-primary'
                            )}>
                              <Icon className="w-3 h-3" fill="currentColor" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <Link to={`/profile/${notification.actor?.username}`} className="font-semibold hover:underline">
                                {notification.actor?.username}
                              </Link>{' '}
                              {notificationMessages[notification.type] || 'interacted with you'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Earlier */}
              {earlierNotifications.length > 0 && (
                <div className="p-4">
                  <h2 className="font-semibold mb-4">Earlier</h2>
                  <div className="space-y-4">
                    {earlierNotifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Heart;
                      return (
                        <div
                          key={notification.id}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-secondary/50 animate-fade-in"
                        >
                          <div className="relative">
                            <Link to={`/profile/${notification.actor?.username}`}>
                              <Avatar className="w-11 h-11 transition-transform hover:scale-105">
                                <AvatarImage src={notification.actor?.avatar_url || ''} alt={notification.actor?.username} />
                                <AvatarFallback>{notification.actor?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className={cn(
                              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center',
                              notificationColors[notification.type] || 'text-primary'
                            )}>
                              <Icon className="w-3 h-3" fill="currentColor" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <Link to={`/profile/${notification.actor?.username}`} className="font-semibold hover:underline">
                                {notification.actor?.username}
                              </Link>{' '}
                              {notificationMessages[notification.type] || 'interacted with you'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {notifications?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-fade-in">
                  <Heart className="w-12 h-12 mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No Activity Yet</h3>
                  <p className="text-sm text-center max-w-sm">
                    When someone likes or comments on your posts, you'll see it here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
