import { useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, CheckCircle, XCircle, Clock, UserCheck, Check, X, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useFollowRequests } from '@/hooks/useFollowRequests';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const notificationIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  follow_request: Clock,
  follow_accepted: UserCheck,
  password_reset_approved: CheckCircle,
  password_reset_rejected: XCircle,
  story_like: Heart,
  story_reply: Play,
  message: MessageCircle,
};

const notificationColors: Record<string, string> = {
  like: 'text-red-500',
  comment: 'text-primary',
  follow: 'text-green-500',
  follow_request: 'text-yellow-500',
  follow_accepted: 'text-green-500',
  password_reset_approved: 'text-green-500',
  password_reset_rejected: 'text-red-500',
  story_like: 'text-red-500',
  story_reply: 'text-purple-500',
  message: 'text-blue-500',
};

const notificationMessages: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  follow_request: 'requested to follow you',
  follow_accepted: 'accepted your follow request',
  password_reset_approved: 'Your password reset has been approved. You can now login with your new password.',
  password_reset_rejected: 'Your password reset request was rejected. Please try again or contact support.',
  story_like: 'liked your story',
  story_reply: 'replied to your story',
  message: 'sent you a message',
};

const Notifications = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const { receivedRequests, acceptRequest, rejectRequest } = useFollowRequests();

  // Mark notifications as read when viewing
  useEffect(() => {
    if (notifications && notifications.some(n => !n.read)) {
      markRead.mutate();
    }
  }, [notifications]);

  const handleAcceptRequest = async (requesterId: string, username: string) => {
    try {
      await acceptRequest.mutateAsync(requesterId);
      toast.success(`You are now following ${username}`);
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    try {
      await rejectRequest.mutateAsync(requesterId);
      toast.success('Request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };

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

  const renderNotification = (notification: any, showFollowActions: boolean = false) => {
    const Icon = notificationIcons[notification.type] || Heart;
    const isFollowRequest = notification.type === 'follow_request';
    
    // Find the corresponding follow request for this notification
    const followRequest = isFollowRequest && showFollowActions 
      ? receivedRequests?.find(r => r.requester_id === notification.actor?.id)
      : null;

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
        
        {/* Follow Request Actions */}
        {isFollowRequest && followRequest && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAcceptRequest(notification.actor?.id, notification.actor?.username)}
              disabled={acceptRequest.isPending}
              className="h-8 px-3 rounded-full"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRejectRequest(notification.actor?.id)}
              disabled={rejectRequest.isPending}
              className="h-8 px-3 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* View Post Button for likes/comments */}
        {notification.post_id && (
          <Link to={`/post/${notification.post_id}`}>
            <Button size="sm" variant="ghost" className="shrink-0">
              View
            </Button>
          </Link>
        )}
      </div>
    );
  };

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
              {/* Pending Follow Requests Section */}
              {receivedRequests && receivedRequests.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Follow Requests ({receivedRequests.length})
                  </h2>
                  <div className="space-y-3">
                    {receivedRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm animate-fade-in"
                      >
                        <Link to={`/profile/${request.requester?.username}`}>
                          <Avatar className="w-11 h-11 transition-transform hover:scale-105 ring-2 ring-primary/20">
                            <AvatarImage src={request.requester?.avatar_url || ''} alt={request.requester?.username} />
                            <AvatarFallback>{request.requester?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${request.requester?.username}`} className="font-semibold hover:underline text-sm">
                            {request.requester?.username}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptRequest(request.requester_id, request.requester?.username)}
                            disabled={acceptRequest.isPending}
                            className="h-8 px-4 rounded-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.requester_id)}
                            disabled={rejectRequest.isPending}
                            className="h-8 px-4 rounded-full"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {todayNotifications.length > 0 && (
                <div className="p-4">
                  <h2 className="font-semibold mb-4">Today</h2>
                  <div className="space-y-4">
                    {todayNotifications.map((notification) => renderNotification(notification, true))}
                  </div>
                </div>
              )}

              {/* Earlier */}
              {earlierNotifications.length > 0 && (
                <div className="p-4">
                  <h2 className="font-semibold mb-4">Earlier</h2>
                  <div className="space-y-4">
                    {earlierNotifications.map((notification) => renderNotification(notification, false))}
                  </div>
                </div>
              )}

              {notifications?.length === 0 && (!receivedRequests || receivedRequests.length === 0) && (
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
