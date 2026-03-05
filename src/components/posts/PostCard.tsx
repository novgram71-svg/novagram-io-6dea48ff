import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Download, Flag, Repeat2, Pin, VolumeX, Volume2 } from 'lucide-react';
import { PostWithUser, useLikePost, useDeletePost } from '@/hooks/usePosts';
import { useSavedPosts, useIsSaved } from '@/hooks/useSavedPosts';
import { useIsReposted, useRepostCount, useToggleRepost, usePinPost } from '@/hooks/useReposts';
import { useIsMuted, useToggleMute } from '@/hooks/useMutedUsers';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  repostedBy?: { username: string } | null;
}

const PostCard = ({ post, repostedBy }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const likeMutation = useLikePost();
  const deletePost = useDeletePost();
  const { toggleSave, isToggling } = useSavedPosts();
  const { data: isSaved } = useIsSaved(post.id);
  const { data: isReposted } = useIsReposted(post.id);
  const { data: repostCount } = useRepostCount(post.id);
  const repostMutation = useToggleRepost();
  const pinMutation = usePinPost();
  const { data: isMuted } = useIsMuted(post.user_id);
  const muteMutation = useToggleMute();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  
  const isLiked = user ? post.likes.some(like => like.user_id === user.id) : false;
  const isOwnPost = user?.id === post.user_id;
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;
  const isPinned = (post as any).is_pinned ?? false;

  const handleRepost = () => {
    if (!user) { navigate('/auth'); return; }
    repostMutation.mutate({ postId: post.id, isReposted: isReposted || false, postOwnerId: post.user_id });
  };

  const handlePin = () => {
    pinMutation.mutate({ postId: post.id, isPinned });
  };

  const handleMute = () => {
    if (!user) return;
    muteMutation.mutate({ targetUserId: post.user_id, isMuted: isMuted || false });
  };

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

  const handleDownloadPost = async () => {
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${post.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Post downloaded!');
    } catch {
      toast.error('Failed to download post');
    }
  };

  const handleReportPost = () => {
    toast.info('Report submitted. Thank you for keeping Gama safe.');
  };

  const handleSave = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleSave({ postId: post.id, isSaved: isSaved || false });
    if (!isSaved) {
      setShowSaveAnimation(true);
      setTimeout(() => setShowSaveAnimation(false), 500);
    }
  };

  return (
    <article className="nova-card overflow-hidden animate-fade-in rounded-2xl">
      {/* Reposted by header */}
      {repostedBy && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <Repeat2 className="w-3.5 h-3.5" />
          <span><span className="font-semibold">{repostedBy.username}</span> reposted</span>
        </div>
      )}
      {/* Pinned indicator */}
      {isPinned && !repostedBy && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <Pin className="w-3.5 h-3.5" />
          <span>Pinned post</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.profiles.username}`} className="flex items-center gap-3 group">
          <div className="story-ring transition-transform duration-300 hover:scale-110">
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
          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
            <DropdownMenuItem onClick={handleDownloadPost} className="rounded-xl gap-2">
              <Download className="w-4 h-4" />
              Download
            </DropdownMenuItem>
            {isOwnPost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePin} className="rounded-xl gap-2">
                  <Pin className="w-4 h-4" />
                  {isPinned ? 'Unpin Post' : 'Pin to Profile'}
                </DropdownMenuItem>
              </>
            )}
            {!isOwnPost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMute} className="rounded-xl gap-2">
                  {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {isMuted ? 'Unmute User' : 'Mute User'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReportPost} className="rounded-xl gap-2 text-destructive focus:text-destructive">
                  <Flag className="w-4 h-4" />
                  Report
                </DropdownMenuItem>
              </>
            )}
            {isOwnPost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-xl gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image with double-tap to like */}
      <div 
        className="relative aspect-square bg-secondary cursor-pointer select-none overflow-hidden rounded-none"
        onClick={handleDoubleTap}
      >
        <img
          src={post.image_url}
          alt={post.caption || ''}
          className="w-full h-full object-cover"
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

        {/* Save animation */}
        {showSaveAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Bookmark 
              className="w-20 h-20 text-primary drop-shadow-lg animate-[scale-in_0.3s_ease-out]"
              fill="currentColor"
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
                'transition-all duration-200 hover:scale-125 active:scale-95 disabled:opacity-50',
                isLiked ? 'text-red-500' : 'text-foreground hover:text-red-500'
              )}
            >
              <Heart className={cn("w-6 h-6 transition-transform", isLiked && "animate-bounce-gentle")} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => setCommentsOpen(true)}
              className="text-foreground hover:text-primary transition-all duration-200 hover:scale-125 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button 
              onClick={handleRepost}
              disabled={repostMutation.isPending}
              className={cn(
                'transition-all duration-200 hover:scale-125 active:scale-95',
                isReposted ? 'text-primary' : 'text-foreground hover:text-primary'
              )}
            >
              <Repeat2 className={cn("w-6 h-6", isReposted && "animate-bounce-gentle")} />
            </button>
            <button 
              onClick={() => setShareOpen(true)}
              className="text-foreground hover:text-primary transition-all duration-200 hover:scale-125 active:scale-95"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isToggling}
            className={cn(
              'transition-all duration-200 hover:scale-125 active:scale-95',
              isSaved ? 'text-primary' : 'text-foreground hover:text-primary'
            )}
          >
            <Bookmark className={cn("w-6 h-6 transition-transform", isSaved && "animate-bounce-gentle")} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Like & Repost Count */}
        <div className="flex items-center gap-3 mb-2">
          <p className="font-semibold text-sm">{formatCount(likeCount)} likes</p>
          {(repostCount ?? 0) > 0 && (
            <p className="text-sm text-muted-foreground">{formatCount(repostCount ?? 0)} reposts</p>
          )}
        </div>

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
            className="text-muted-foreground text-sm mt-2 hover:text-foreground transition-all duration-200 hover:translate-x-1"
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
      {deleteDialogOpen && (
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
      )}
    </article>
  );
};

export default PostCard;
