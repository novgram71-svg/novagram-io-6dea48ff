import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Feed = () => {
  const { data: posts, isLoading, error } = usePosts();
  const { user } = useAuth();

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

  if (!posts || posts.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="nova-card p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-4">
            {user ? "Be the first to share something!" : "Sign in to see posts from people you follow."}
          </p>
          {user ? (
            <Link to="/create">
              <Button className="bg-primary hover:bg-primary/90">Create Post</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0">
      {posts.map((post, index) => (
        <div 
          key={post.id} 
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default Feed;
