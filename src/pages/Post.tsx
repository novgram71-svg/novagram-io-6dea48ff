import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ArrowLeft, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';

const Post = () => {
  const { postId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .eq('id', postId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  // Check if post owner has private account
  const { data: isPrivateAccount } = useQuery({
    queryKey: ['post-privacy', post?.user_id],
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

  // Check if current user follows the post owner
  const { data: isFollowing } = useQuery({
    queryKey: ['is-following-post-owner', user?.id, post?.user_id],
    queryFn: async () => {
      if (!user || !post?.user_id || user.id === post.user_id) return true;

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();

      return !!data;
    },
    enabled: !!user && !!post?.user_id,
  });

  const isLoading = authLoading || postLoading;
  const canViewPost = !isPrivateAccount || (user && (isFollowing || user.id === post?.user_id));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <Helmet>
          <title>Post Not Found | Novagram</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <h1 className="text-2xl font-bold">Post Not Found</h1>
          <p className="text-muted-foreground">This post may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </MainLayout>
    );
  }

  // Private post - user not logged in or not following
  if (!canViewPost) {
    return (
      <MainLayout>
        <Helmet>
          <title>Private Post | Novagram</title>
        </Helmet>
        <div className="max-w-2xl mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">This Post is Private</h1>
            <p className="text-muted-foreground max-w-md">
              {user 
                ? "You need to follow this user to view their posts."
                : "Log in and follow this user to view their posts."
              }
            </p>
            {!user && (
              <Button onClick={() => navigate('/auth')}>
                Log In
              </Button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <MainLayout>
      <Helmet>
        <title>{post.caption ? `${post.caption.substring(0, 50)} | Novagram` : 'Post | Novagram'}</title>
        <meta name="description" content={post.caption || 'View this post on Novagram'} />
        <meta property="og:title" content={`${post.profiles.username}'s post on Novagram`} />
        <meta property="og:description" content={post.caption || 'View this post on Novagram'} />
        <meta property="og:image" content={post.image_url} />
      </Helmet>

      <div className="max-w-2xl mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <article className="nova-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <Link to={`/profile/${post.profiles.username}`}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.profiles.avatar_url || ''} alt={post.profiles.username} />
                <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${post.profiles.username}`} className="font-semibold hover:text-primary">
                {post.profiles.username}
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {/* Image */}
          <div className="relative aspect-square bg-secondary">
            <img
              src={post.image_url}
              alt={post.caption || ''}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{post.likes.length} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments.length} comments</span>
              </div>
            </div>

            {post.caption && (
              <p className="text-sm">
                <span className="font-semibold">{post.profiles.username}</span>{' '}
                {post.caption}
              </p>
            )}
          </div>
        </article>
      </div>
    </MainLayout>
  );
};

export default Post;
