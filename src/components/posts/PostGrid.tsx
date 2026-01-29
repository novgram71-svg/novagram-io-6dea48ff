import { useState, memo } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import PostModal from './PostModal';

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  likes: { user_id: string }[] | { count: number }[];
  comments: { id: string }[] | { count: number }[];
}

interface NormalizedPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

interface PostGridProps {
  posts: Post[] | undefined;
  isLoading: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

const PostGridItem = memo(({ 
  post, 
  index, 
  onClick 
}: { 
  post: Post; 
  index: number; 
  onClick: () => void;
}) => {
  const likesCount = Array.isArray(post.likes) 
    ? (post.likes[0] as any)?.count ?? post.likes.length 
    : 0;
  const commentsCount = Array.isArray(post.comments) 
    ? (post.comments[0] as any)?.count ?? post.comments.length 
    : 0;

  return (
    <button
      onClick={onClick}
      className="relative group overflow-hidden aspect-square animate-fade-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <img
        src={post.image_url}
        alt={post.caption || ''}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Hover overlay with stats */}
      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Heart className="w-5 h-5 fill-foreground" />
          <span>{likesCount}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <MessageCircle className="w-5 h-5 fill-foreground" />
          <span>{commentsCount}</span>
        </div>
      </div>

      {/* User info on hover - bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 border border-border">
            <AvatarImage src={post.profiles?.avatar_url || ''} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {post.profiles?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground truncate">
            {post.profiles?.username}
          </span>
        </div>
      </div>
    </button>
  );
});

PostGridItem.displayName = 'PostGridItem';

const PostGrid = ({ posts, isLoading, emptyMessage = 'No posts yet', emptyIcon }: PostGridProps) => {
  const [selectedPost, setSelectedPost] = useState<NormalizedPost | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        {emptyIcon}
        <p className="mt-4">{emptyMessage}</p>
      </div>
    );
  }

  // Normalize post data for modal (handle both count and array formats)
  const normalizePost = (post: Post): NormalizedPost => ({
    ...post,
    likes: Array.isArray(post.likes) && post.likes.length > 0 && 'user_id' in post.likes[0]
      ? post.likes as { user_id: string }[]
      : [],
    comments: Array.isArray(post.comments) && post.comments.length > 0 && 'id' in post.comments[0]
      ? post.comments as { id: string }[]
      : [],
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post, index) => (
          <PostGridItem
            key={post.id}
            post={post}
            index={index}
            onClick={() => setSelectedPost(normalizePost(post))}
          />
        ))}
      </div>

      <PostModal
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
};

export default PostGrid;
