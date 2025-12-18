import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Grid3X3, Bookmark, Settings, MessageCircle, UserPlus, UserCheck, LogOut } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useProfileStats, useIsFollowing, useToggleFollow } from '@/hooks/useProfiles';
import { useUserPosts } from '@/hooks/usePosts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { username } = useParams();
  const { user, profile: currentUserProfile, signOut, loading: authLoading } = useAuth();
  
  // If no username in URL, show current user's profile
  const targetUsername = username || currentUserProfile?.username;
  
  const { data: profile, isLoading: profileLoading } = useProfile(targetUsername);
  const { data: stats, isLoading: statsLoading } = useProfileStats(profile?.id);
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.id);
  const { data: isFollowing } = useIsFollowing(profile?.id);
  const toggleFollow = useToggleFollow();

  const isOwnProfile = user?.id === profile?.id;

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleToggleFollow = () => {
    if (!profile) return;
    toggleFollow.mutate({ targetUserId: profile.id, isFollowing: isFollowing || false });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading || profileLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
              <Skeleton className="w-24 h-24 md:w-36 md:h-36 rounded-full" />
              <div className="flex-1 text-center md:text-left space-y-4">
                <Skeleton className="w-32 h-6 mx-auto md:mx-0" />
                <div className="flex justify-center md:justify-start gap-8">
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If no username param and user not logged in, redirect to auth
  if (!username && !user) {
    return <Navigate to="/auth" replace />;
  }

  // If profile not found
  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-8 p-6 text-center">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-muted-foreground mt-2">This account doesn't exist.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-8">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold">{profile.username}</h1>
            {isOwnProfile && (
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
            {/* Avatar */}
            <div className="story-ring p-1">
              <Avatar className="w-24 h-24 md:w-36 md:h-36 border-4 border-background">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="text-2xl">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{profile.username}</h2>
                
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Edit Profile
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                ) : user ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleToggleFollow}
                      disabled={toggleFollow.isPending}
                      className={cn(
                        isFollowing 
                          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                      size="sm"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-primary hover:bg-primary/90" size="sm">
                      Sign in to follow
                    </Button>
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-4">
                <div className="text-center">
                  <span className="font-bold block">{stats?.postCount || 0}</span>
                  <span className="text-sm text-muted-foreground">posts</span>
                </div>
                <button className="text-center hover:opacity-80 transition-opacity">
                  <span className="font-bold block">{formatCount(stats?.followersCount || 0)}</span>
                  <span className="text-sm text-muted-foreground">followers</span>
                </button>
                <button className="text-center hover:opacity-80 transition-opacity">
                  <span className="font-bold block">{formatCount(stats?.followingCount || 0)}</span>
                  <span className="text-sm text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm whitespace-pre-line">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-center border-t border-border bg-transparent h-12">
            <TabsTrigger 
              value="posts" 
              className="flex items-center gap-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">POSTS</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="flex items-center gap-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">SAVED</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    className="aspect-square relative group overflow-hidden"
                  >
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        ❤️ {post.likes.length}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        💬 {post.comments.length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Grid3X3 className="w-12 h-12 mb-4" />
                <h3 className="font-semibold text-lg mb-1">No Posts Yet</h3>
                {isOwnProfile && (
                  <Link to="/create">
                    <Button className="mt-4 bg-primary hover:bg-primary/90">Create Post</Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bookmark className="w-12 h-12 mb-4" />
                <h3 className="font-semibold text-lg mb-1">Save</h3>
                <p className="text-sm text-center max-w-sm">
                  Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
                </p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;
