import { useFeedPosts } from '@/hooks/useFeedPosts';
import { useAuth } from '@/hooks/useAuth';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PullToRefresh from './PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import SuggestedUsers from '@/components/feed/SuggestedUsers';

const Feed = () => {
  const { data: rawPosts, isLoading } = useFeedPosts();
  const posts = rawPosts?.filter(p => p.profiles != null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="nova-card overflow-hidden rounded-2xl" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-28 h-4 rounded-full" />
                <Skeleton className="w-16 h-3 rounded-full" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-4 space-y-3">
              <div className="flex gap-4">
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="w-7 h-7 rounded-full" />
              </div>
              <Skeleton className="w-20 h-4 rounded-full" />
              <Skeleton className="w-full h-4 rounded-full" />
              <Skeleton className="w-3/4 h-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        {/* Show suggestions when no posts */}
        <SuggestedUsers />
        
        <div className="nova-card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-gentle">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-4">
            {user 
              ? "Follow people to see their posts here, or create your own!" 
              : "Sign in to see posts from people you follow."}
          </p>
          {user ? (
            <div className="flex gap-3 justify-center">
              <Link to="/explore">
                <Button variant="outline" className="transition-all duration-300 hover:scale-105">
                  Discover People
                </Button>
              </Link>
              <Link to="/create">
                <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                  Create Post
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const feedContent = (
    <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0 pb-20 animate-page-enter">
      {/* Show suggestions after first 2 posts */}
      {posts.slice(0, 2).map((post, index) => (
        <div 
          key={post.id} 
          className="animate-slide-up opacity-0"
          style={{ 
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <PostCard post={post} />
        </div>
      ))}
      
      {/* Suggestions card */}
      {posts.length >= 2 && <SuggestedUsers />}
      
      {/* Rest of posts */}
      {posts.slice(2).map((post, index) => (
        <div 
          key={post.id} 
          className="animate-slide-up opacity-0"
          style={{ 
            animationDelay: `${(index + 2) * 50}ms`,
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
