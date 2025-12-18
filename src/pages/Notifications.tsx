import { Heart, MessageCircle, UserPlus, Send } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { mockNotifications } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  dm: Send,
};

const notificationColors = {
  like: 'text-red-500',
  comment: 'text-primary',
  follow: 'text-green-500',
  dm: 'text-primary',
};

const Notifications = () => {
  const todayNotifications = mockNotifications.filter(n => 
    n.timestamp.includes('m ago') || n.timestamp.includes('h ago')
  );
  const earlierNotifications = mockNotifications.filter(n => 
    !n.timestamp.includes('m ago') && !n.timestamp.includes('h ago')
  );

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
          {/* Today */}
          {todayNotifications.length > 0 && (
            <div className="p-4">
              <h2 className="font-semibold mb-4">Today</h2>
              <div className="space-y-4">
                {todayNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-colors animate-fade-in',
                        !notification.isRead && 'bg-secondary'
                      )}
                    >
                      <div className="relative">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={notification.user.profilePhoto} alt={notification.user.username} />
                          <AvatarFallback>{notification.user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center',
                          notificationColors[notification.type]
                        )}>
                          <Icon className="w-3 h-3" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{notification.user.username}</span>{' '}
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                      {notification.type === 'follow' && (
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Follow
                        </Button>
                      )}
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
                  const Icon = notificationIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                    >
                      <div className="relative">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={notification.user.profilePhoto} alt={notification.user.username} />
                          <AvatarFallback>{notification.user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center',
                          notificationColors[notification.type]
                        )}>
                          <Icon className="w-3 h-3" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{notification.user.username}</span>{' '}
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mockNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Heart className="w-12 h-12 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Activity</h3>
              <p className="text-sm text-center max-w-sm">
                When someone likes or comments on your posts, you'll see it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
