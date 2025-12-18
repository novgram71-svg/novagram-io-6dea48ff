import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <article className="nova-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-3 group">
          <div className="story-ring">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={post.user.profilePhoto} alt={post.user.username} />
              <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
              {post.user.username}
            </p>
            <p className="text-xs text-muted-foreground">{post.timestamp}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-secondary">
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                'transition-all duration-200 hover:scale-110',
                isLiked ? 'text-red-500' : 'text-foreground hover:text-red-500'
              )}
            >
              <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
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
        <p className="text-sm">
          <Link to={`/profile/${post.user.username}`} className="font-semibold hover:text-primary transition-colors">
            {post.user.username}
          </Link>{' '}
          <span className="text-foreground/90">{post.caption}</span>
        </p>

        {/* Comments Link */}
        {post.commentCount > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-muted-foreground text-sm mt-2 hover:text-foreground transition-colors"
          >
            View all {post.commentCount} comments
          </button>
        )}
      </div>
    </article>
  );
};

export default PostCard;
