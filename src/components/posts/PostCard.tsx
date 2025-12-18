import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { PostWithUser, useLikePost } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import CommentsSheet from './CommentsSheet';

interface PostCardProps {
  post: PostWithUser;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const likeMutation = useLikePost();
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  const isLiked = user ? post.likes.some(like => like.user_id === user.id) : false;
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;
  
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    likeMutation.mutate({ postId: post.id, isLiked });
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article className="nova-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.profiles.username}`} className="flex items-center gap-3 group">
          <div className="story-ring">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={post.profiles.avatar_url || ''} alt={post.profiles.username} />
              <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
              {post.profiles.username}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-secondary">
        <img
          src={post.image_url}
          alt={post.caption || ''}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={cn(
                'transition-all duration-200 hover:scale-110 disabled:opacity-50',
                isLiked ? 'text-red-500' : 'text-foreground hover:text-red-500'
              )}
            >
              <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => setCommentsOpen(true)}
              className="text-foreground hover:text-primary transition-colors hover:scale-110"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="text-foreground hover:text-primary transition-colors hover:scale-110">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={cn(
              'transition-all duration-200 hover:scale-110',
              isSaved ? 'text-primary' : 'text-foreground hover:text-primary'
            )}
          >
            <Bookmark className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Like Count */}
        <p className="font-semibold text-sm mb-2">{formatCount(likeCount)} likes</p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <Link to={`/profile/${post.profiles.username}`} className="font-semibold hover:text-primary transition-colors">
              {post.profiles.username}
            </Link>{' '}
            <span className="text-foreground/90">{post.caption}</span>
          </p>
        )}

        {/* Comments Link */}
        {commentCount > 0 && (
          <button 
            onClick={() => setCommentsOpen(true)}
            className="text-muted-foreground text-sm mt-2 hover:text-foreground transition-colors"
          >
            View all {commentCount} comments
          </button>
        )}
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        postId={post.id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </article>
  );
};

export default PostCard;
