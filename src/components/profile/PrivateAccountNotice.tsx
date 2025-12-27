import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToggleFollow, useIsFollowing } from '@/hooks/useProfiles';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PrivateAccountNoticeProps {
  username: string;
  userId: string;
}

const PrivateAccountNotice = ({ username, userId }: PrivateAccountNoticeProps) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(userId);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    if (!user) return;
    toggleFollow.mutate({ targetUserId: userId, isFollowing: isFollowing || false });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center mb-4">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">This Account is Private</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Follow this account to see their photos and videos.
      </p>
      {user ? (
        <Button
          onClick={handleFollow}
          disabled={toggleFollow.isPending}
          className={cn(
            "transition-all duration-200",
            isFollowing 
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {isFollowing ? 'Requested' : 'Follow'}
        </Button>
      ) : (
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">
            Sign in to follow
          </Button>
        </Link>
      )}
    </div>
  );
};

export default PrivateAccountNotice;