import { Link } from 'react-router-dom';
import { UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuggestedUsers } from '@/hooks/useFeedPosts';
import { useToggleFollow } from '@/hooks/useProfiles';
import { useState } from 'react';
import { toast } from 'sonner';

const SuggestedUsers = () => {
  const { data: suggestions, isLoading } = useSuggestedUsers();
  const toggleFollow = useToggleFollow();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!isLoading && (!suggestions || suggestions.length === 0))) {
    return null;
  }

  const handleFollow = async (userId: string) => {
    try {
      await toggleFollow.mutateAsync({
        targetUserId: userId,
        isFollowing: false,
        isPrivate: false,
      });
      setFollowingIds(prev => new Set([...prev, userId]));
      toast.success('Following!');
    } catch (error) {
      toast.error('Failed to follow');
    }
  };

  if (isLoading) {
    return (
      <div className="nova-card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleSuggestions = suggestions?.filter(s => !followingIds.has(s.id));

  if (!visibleSuggestions || visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="nova-card p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Suggested for you
        </h3>
        <button 
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {visibleSuggestions.slice(0, 5).map((user) => (
          <div 
            key={user.id} 
            className="flex items-center gap-3 group"
          >
            <Link to={`/profile/${user.username}`}>
              <Avatar className="w-10 h-10 ring-2 ring-border group-hover:ring-primary transition-all">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link 
                to={`/profile/${user.username}`}
                className="font-medium text-sm hover:text-primary transition-colors truncate block"
              >
                {user.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {user.followersCount} {user.followersCount === 1 ? 'follower' : 'followers'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFollow(user.id)}
              disabled={toggleFollow.isPending}
              className="h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Follow
            </Button>
          </div>
        ))}
      </div>
      <Link 
        to="/explore" 
        className="text-xs text-primary hover:underline block mt-4"
      >
        See all suggestions
      </Link>
    </div>
  );
};

export default SuggestedUsers;
