import { usePosts, PostWithUser } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PullToRefresh from './PullToRefresh';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const Feed = () => {
  const { data: posts, isLoading, error } = usePosts();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Get list of users that the current user follows
  const { data: following } = useQuery({
    queryKey: ['following-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      return data?.map(f => f.following_id) || [];
    },
    enabled: !!user,
  });

  // Get list of private accounts
  const { data: privateAccounts } = useQuery({
    queryKey: ['private-accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('private_account', true);
      return data?.map(s => s.user_id) || [];
    },
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  // Filter posts: hide private account posts if not following them
  const filteredPosts = posts?.filter((post: PostWithUser) => {
    // Always show own posts
    if (user && post.user_id === user.id) return true;
    
    // If account is private
    if (privateAccounts?.includes(post.user_id)) {
      // Only show if following
      return following?.includes(post.user_id);
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="nova-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredPosts || filteredPosts.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="nova-card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-gentle">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-4">
            {user ? "Be the first to share something!" : "Sign in to see posts from people you follow."}
          </p>
          {user ? (
            <Link to="/create">
              <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">Create Post</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const feedContent = (
    <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0 pb-20">
      {filteredPosts.map((post, index) => (
        <div 
          key={post.id} 
          className="animate-slide-up opacity-0"
          style={{ 
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        {feedContent}
      </PullToRefresh>
    );
  }

  return feedContent;
};

export default Feed;
