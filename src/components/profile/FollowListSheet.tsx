import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToggleFollow, useIsFollowing } from '@/hooks/useProfiles';
import { Link } from 'react-router-dom';

interface FollowListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: 'followers' | 'following';
  username: string;
}

interface FollowUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

const FollowListSheet = ({ open, onOpenChange, userId, type, username }: FollowListSheetProps) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      if (type === 'followers') {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            follower:profiles!follows_follower_id_fkey(id, username, avatar_url)
          `)
          .eq('following_id', userId);

        if (error) throw error;
        return data.map(d => d.follower) as FollowUser[];
      } else {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            following:profiles!follows_following_id_fkey(id, username, avatar_url)
          `)
          .eq('follower_id', userId);

        if (error) throw error;
        return data.map(d => d.following) as FollowUser[];
      }
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>{type === 'followers' ? 'Followers' : 'Following'}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(70vh-80px)] mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-2">
              {users.map((followUser) => (
                <FollowUserItem 
                  key={followUser.id} 
                  user={followUser} 
                  currentUserId={user?.id}
                  onClose={() => onOpenChange(false)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

interface FollowUserItemProps {
  user: FollowUser;
  currentUserId: string | undefined;
  onClose: () => void;
}

const FollowUserItem = ({ user, currentUserId, onClose }: FollowUserItemProps) => {
  const { data: isFollowing } = useIsFollowing(user.id);
  const toggleFollow = useToggleFollow();
  const isOwnProfile = currentUserId === user.id;

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow.mutate({ targetUserId: user.id, isFollowing: isFollowing || false });
  };

  return (
    <Link 
      to={`/profile/${user.username}`}
      onClick={onClose}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user?.avatar_url || ''} alt={user?.username || 'User'} />
          <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.username}</p>
        </div>
      </div>
      
      {currentUserId && !isOwnProfile && (
        <Button
          onClick={handleToggleFollow}
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          disabled={toggleFollow.isPending}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      )}
    </Link>
  );
};

export default FollowListSheet;