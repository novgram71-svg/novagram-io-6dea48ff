import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SharedPostCardProps {
  postId: string;
  isOwn: boolean;
  className?: string;
}

const SharedPostCard = ({ postId, isOwn, className }: SharedPostCardProps) => {
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['sharedPost', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: likesCount } = useQuery({
    queryKey: ['postLikesCount', postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: commentsCount } = useQuery({
    queryKey: ['postCommentsCount', postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className={cn(
        'w-64 h-48 rounded-xl animate-pulse',
        isOwn ? 'bg-primary-foreground/20' : 'bg-muted'
      )} />
    );
  }

  if (!post) {
    return (
      <div className={cn(
        'w-64 p-4 rounded-xl',
        isOwn ? 'bg-primary-foreground/20' : 'bg-muted'
      )}>
        <p className="text-sm opacity-70">Post no longer available</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(`/post/${postId}`)}
      className={cn(
        'w-64 rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02]',
        isOwn ? 'bg-primary-foreground/20' : 'bg-muted',
        className
      )}
    >
      {/* Post Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={post.image_url}
          alt="Shared post"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Stats overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 text-white text-sm">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4 fill-current" />
            {likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {commentsCount}
          </span>
        </div>
      </div>

      {/* Post Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <img
            src={post.profiles?.avatar_url || '/placeholder.svg'}
            alt={post.profiles?.username}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-sm font-medium truncate">{post.profiles?.username}</span>
        </div>
        {post.caption && (
          <p className="text-xs opacity-80 line-clamp-2">{post.caption}</p>
        )}
      </div>
    </button>
  );
};

export default SharedPostCard;
