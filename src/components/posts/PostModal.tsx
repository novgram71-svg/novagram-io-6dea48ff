import { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useLikePost } from '@/hooks/usePosts';
import { useSavedPosts, useIsSaved } from '@/hooks/useSavedPosts';
import CommentsSheet from './CommentsSheet';
import SharePostSheet from './SharePostSheet';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PostModalProps {
  post: {
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
  } | null;
  open: boolean;
  onClose: () => void;
}

const PostModal = ({ post, open, onClose }: PostModalProps) => {
  const { user } = useAuth();
  const likePost = useLikePost();
  const { toggleSave, isToggling } = useSavedPosts();
  const { data: isSaved } = useIsSaved(post?.id || '');
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Check if post is public
  const { data: isPrivate } = useQuery({
    queryKey: ['post-privacy-modal', post?.user_id],
    queryFn: async () => {
      if (!post?.user_id) return false;
      const { data } = await supabase
        .from('user_settings')
        .select('private_account')
        .eq('user_id', post.user_id)
        .maybeSingle();
      return data?.private_account ?? false;
    },
    enabled: !!post?.user_id,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!post) return null;

  const isLiked = post.likes.some(like => like.user_id === user?.id);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const handleLike = () => {
    if (!user) return;
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    likePost.mutate({ 
      postId: post.id, 
      isLiked, 
      postOwnerId: post.user_id 
    });
  };

  const handleSave = () => {
    if (!user) return;
    toggleSave({ postId: post.id, isSaved: isSaved || false });
  };

  const handleDoubleClick = () => {
    if (!user || isLiked) return;
    handleLike();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-card border-border max-h-[90vh]">
          <VisuallyHidden>
            <DialogTitle>Post by {post.profiles.username}</DialogTitle>
          </VisuallyHidden>
          
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            {/* Image Section */}
            <div 
              className="relative flex-1 bg-background flex items-center justify-center min-h-[300px] md:min-h-[500px]"
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Post image'}
                className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
              />
              
              {/* Double-tap heart animation */}
              {isLikeAnimating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-24 h-24 text-primary fill-primary animate-ping" />
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="w-full md:w-[350px] flex flex-col bg-card border-l border-border">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Link to={`/profile/${post.profiles.username}`} onClick={onClose}>
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarImage src={post.profiles.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {post.profiles.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/profile/${post.profiles.username}`} 
                    onClick={onClose}
                    className="font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {post.profiles.username}
                  </Link>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Caption & Comments Preview */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {post.caption && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={post.profiles.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {post.profiles.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <Link 
                          to={`/profile/${post.profiles.username}`}
                          onClick={onClose}
                          className="font-semibold hover:text-primary transition-colors mr-2"
                        >
                          {post.profiles.username}
                        </Link>
                        {post.caption}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                  </div>
                )}

                {post.comments.length > 0 && (
                  <button 
                    onClick={() => setShowComments(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleLike}
                      disabled={!user}
                      className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      <Heart 
                        className={cn(
                          "w-6 h-6 transition-colors",
                          isLiked ? "fill-destructive text-destructive" : "hover:text-destructive"
                        )} 
                      />
                    </button>
                    <button
                      onClick={() => setShowComments(true)}
                      className="transition-transform hover:scale-110"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setShowShare(true)}
                      className="transition-transform hover:scale-110"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!user || isToggling}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Bookmark 
                      className={cn(
                        "w-6 h-6 transition-colors",
                        isSaved ? "fill-foreground" : ""
                      )} 
                    />
                  </button>
                </div>

                <p className="font-semibold text-sm">
                  {post.likes.length} like{post.likes.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground uppercase">{timeAgo}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Sheet */}
      <CommentsSheet 
        postId={post.id}
        postOwnerId={post.user_id}
        open={showComments} 
        onOpenChange={setShowComments} 
      />

      {/* Share Sheet */}
      <SharePostSheet
        postId={post.id}
        isPublic={!isPrivate}
        open={showShare}
        onOpenChange={setShowShare}
      />
    </>
  );
};

export default PostModal;
