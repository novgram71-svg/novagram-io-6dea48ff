import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { PostWithUser, useLikePost, useDeletePost } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import CommentsSheet from './CommentsSheet';
import SharePostSheet from './SharePostSheet';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PostCardProps {
  post: PostWithUser;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const likeMutation = useLikePost();
  const deletePost = useDeletePost();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  
  const isLiked = user ? post.likes.some(like => like.user_id === user.id) : false;
  const isOwnPost = user?.id === post.user_id;
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;
  
  const [isSaved, setIsSaved] = useState(false);

  // Check if post owner has public account
  const { data: isPublicPost } = useQuery({
    queryKey: ['post-public', post.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('private_account')
        .eq('user_id', post.user_id)
        .maybeSingle();
      
      return !(data?.private_account ?? false);
    },
  });

  const handleLike = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    likeMutation.mutate({ postId: post.id, isLiked, postOwnerId: post.user_id });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - like if not already liked
      if (!isLiked) {
        handleLike();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const handleDeletePost = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost && (
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image with double-tap to like */}
      <div 
        className="relative aspect-square bg-secondary cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        <img
          src={post.image_url}
          alt={post.caption || ''}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
          draggable={false}
        />
        
        {/* Heart animation on double tap */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              className="w-24 h-24 text-white drop-shadow-lg animate-[scale-in_0.3s_ease-out,fade-out_0.5s_0.5s_ease-out_forwards]"
              fill="white"
            />
          </div>
        )}
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
            <button 
              onClick={() => setShareOpen(true)}
              className="text-foreground hover:text-primary transition-colors hover:scale-110"
            >
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
        postOwnerId={post.user_id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />

      {/* Share Sheet */}
      <SharePostSheet
        postId={post.id}
        isPublic={isPublicPost ?? true}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and all associated likes and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default PostCard;
