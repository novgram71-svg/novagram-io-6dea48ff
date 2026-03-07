import { useState, useCallback } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { Grid3X3, Bookmark, LogOut, UserPlus, UserCheck, MessageCircle, Flag, Ban, MoreHorizontal, Settings, Lock, Clock, UserX, X, Pin, VolumeX, Volume2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PullToRefresh from '@/components/posts/PullToRefresh';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useProfileStats, useIsFollowing, useToggleFollow, useHasPendingRequest } from '@/hooks/useProfiles';
import { useUserPosts } from '@/hooks/usePosts';
import { useIsPrivateAccount, useCanViewProfile } from '@/hooks/usePrivateAccount';
import { useIsBlocked, useToggleBlock } from '@/hooks/useUserModeration';
import { useIsMuted, useToggleMute } from '@/hooks/useMutedUsers';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useFollowRequests } from '@/hooks/useFollowRequests';
import { useUserVerificationStatus, useVerification } from '@/hooks/useVerification';
import { useStories } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import AvatarEditorDialog from '@/components/profile/AvatarEditorDialog';
import FlippableAvatar from '@/components/profile/FlippableAvatar';
import ReportUserDialog from '@/components/profile/ReportUserDialog';
import FollowListSheet from '@/components/profile/FollowListSheet';
import { FollowRequestsSheet } from '@/components/profile/FollowRequestsSheet';
import PrivateAccountNotice from '@/components/profile/PrivateAccountNotice';
import AccountSwitcher from '@/components/profile/AccountSwitcher';
import NovaBadge from '@/components/profile/NovaBadge';
import { useUserAvatar } from '@/hooks/useAvatar';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile: currentUserProfile, signOut, loading: authLoading } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followRequestsOpen, setFollowRequestsOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  // If no username in URL, show current user's profile
  const targetUsername = username || currentUserProfile?.username;
  
  const { data: profile, isLoading: profileLoading } = useProfile(targetUsername);
  const { data: stats, isLoading: statsLoading } = useProfileStats(profile?.id);
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.id);
  const { data: isFollowing } = useIsFollowing(profile?.id);
  const { data: isBlocked } = useIsBlocked(profile?.id);
  const { data: isMuted } = useIsMuted(profile?.id);
  const muteMutation = useToggleMute();
  const { data: isPrivate } = useIsPrivateAccount(profile?.id);
  const { data: canViewProfile } = useCanViewProfile(profile?.id, user?.id);
  const { data: hasPendingRequest } = useHasPendingRequest(profile?.id);
  const { receivedRequests } = useFollowRequests();
  const { isVerified } = useUserVerificationStatus(profile?.id);
  const { data: allStories } = useStories();
  const toggleFollow = useToggleFollow();
  const toggleBlock = useToggleBlock();
  const { savedPosts, isLoading: savedLoading } = useSavedPosts();
  const { data: userAvatar } = useUserAvatar(profile?.id);

  // Check if this profile has active stories
  const hasActiveStory = allStories?.some(s => s.profiles?.id === profile?.id) ?? false;

  const isOwnProfile = user?.id === profile?.id;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    await queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
  }, [queryClient]);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const pendingRequestsCount = receivedRequests?.length || 0;

  const handleToggleFollow = () => {
    if (!profile) return;
    toggleFollow.mutate(
      { 
        targetUserId: profile.id, 
        isFollowing: isFollowing || false,
        isPrivate: isPrivate || false,
        hasPendingRequest: hasPendingRequest || false,
      },
      {
        onSuccess: (result) => {
          if (result?.action === 'requested') {
            toast({ title: 'Follow request sent!' });
          } else if (result?.action === 'cancelled') {
            toast({ title: 'Follow request cancelled' });
          }
        },
      }
    );
  };

  const handleToggleBlock = () => {
    if (!profile) return;
    toggleBlock.mutate({ targetUserId: profile.id, isBlocked: isBlocked || false });
  };

  const handleMessage = () => {
    if (!profile) return;
    navigate('/messages', { state: { selectedUserId: profile.id, selectedUsername: profile.username } });
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
        <div className="max-w-4xl mx-auto pb-8 p-6 text-center animate-fade-in">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-muted-foreground mt-2">This account doesn't exist.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-4xl mx-auto pb-8">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              {isOwnProfile ? (
                <AccountSwitcher username={profile.username} avatarUrl={profile.avatar_url} />
              ) : (
                <h1 className="text-lg font-bold">{profile.username}</h1>
              )}
              <div className="flex items-center gap-2">
                {!isOwnProfile && user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => muteMutation.mutate({ targetUserId: profile!.id, isMuted: isMuted || false })}>
                        {isMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                        {isMuted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleBlock}>
                        <Ban className="w-4 h-4 mr-2" />
                        {isBlocked ? 'Unblock' : 'Block'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isOwnProfile && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                      <Settings className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Profile Info */}
          <div className="p-6 animate-slide-up">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
              {/* Avatar - Flippable with story ring */}
              <FlippableAvatar
                photoUrl={profile.avatar_url || null}
                avatarUrl={userAvatar?.avatar_url || null}
                username={profile.username}
                hasActiveStory={hasActiveStory}
                onPhotoClick={() => setPhotoViewerOpen(true)}
              />

            {/* Info */}
            <div className="flex-1 text-center md:text-left animate-slide-up stagger-1">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                {isOwnProfile ? (
                  <div className="hidden md:block">
                    <AccountSwitcher username={profile.username} avatarUrl={profile.avatar_url} />
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <h2 className={cn("text-xl font-semibold gradient-text", isOwnProfile && "md:hidden")}>{profile.username}</h2>
                  {isVerified && <NovaBadge size="md" />}
                </div>
                
                {isOwnProfile ? (
                  <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setEditDialogOpen(true)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAvatarEditorOpen(true)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      🎭 Avatar
                    </Button>
                    {pendingRequestsCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFollowRequestsOpen(true)}
                        className="transition-all duration-200 hover:scale-105 relative"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Requests
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {pendingRequestsCount}
                        </Badge>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="w-5 h-5" />
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
                        "transition-all duration-200 hover:scale-105",
                        isFollowing 
                          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                          : hasPendingRequest
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                      size="sm"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : hasPendingRequest ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Requested
                        </>
                      ) : isPrivate ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Request to Follow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleMessage}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    
                    {/* Desktop dropdown for report/block */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hidden md:flex">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => muteMutation.mutate({ targetUserId: profile!.id, isMuted: isMuted || false })}>
                          {isMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                          {isMuted ? 'Unmute' : 'Mute'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleToggleBlock}>
                          <Ban className="w-4 h-4 mr-2" />
                          {isBlocked ? 'Unblock' : 'Block'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105" size="sm">
                      Sign in to follow
                    </Button>
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-4 animate-slide-up stagger-2">
                <div className="text-center transition-all duration-300 hover:scale-125 cursor-default">
                  <span className="font-bold block text-lg">{stats?.postCount || 0}</span>
                  <span className="text-sm text-muted-foreground">posts</span>
                </div>
                <button 
                  onClick={() => setFollowersOpen(true)}
                  className="text-center hover:opacity-80 transition-all duration-300 hover:scale-125"
                >
                  <span className="font-bold block text-lg">{formatCount(stats?.followersCount || 0)}</span>
                  <span className="text-sm text-muted-foreground">followers</span>
                </button>
                <button 
                  onClick={() => setFollowingOpen(true)}
                  className="text-center hover:opacity-80 transition-all duration-300 hover:scale-125"
                >
                  <span className="font-bold block text-lg">{formatCount(stats?.followingCount || 0)}</span>
                  <span className="text-sm text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm whitespace-pre-line animate-slide-up stagger-3">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Posts Grid - Only show if can view profile or is own profile */}
        {(canViewProfile || isOwnProfile) ? (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full justify-center border-t border-border bg-transparent h-12">
              <TabsTrigger 
                value="posts" 
                className="flex items-center gap-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none transition-all duration-200"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">POSTS</span>
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger 
                  value="saved" 
                  className="flex items-center gap-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none transition-all duration-200"
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
                  {/* Sort: pinned first, then by date */}
                  {[...posts].sort((a, b) => {
                    const aPinned = (a as any).is_pinned ? 1 : 0;
                    const bPinned = (b as any).is_pinned ? 1 : 0;
                    if (bPinned !== aPinned) return bPinned - aPinned;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  }).map((post, index) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="aspect-square relative group overflow-hidden animate-fade-in rounded-sm md:rounded-lg"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Pinned indicator */}
                      {(post as any).is_pinned && (
                        <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                          <Pin className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <span className="flex items-center gap-1 text-foreground font-semibold text-sm">
                          ❤️ {post.likes.length}
                        </span>
                        <span className="flex items-center gap-1 text-foreground font-semibold text-sm">
                          💬 {post.comments.length}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-fade-in">
                  <Grid3X3 className="w-12 h-12 mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No Posts Yet</h3>
                  {isOwnProfile && (
                    <Link to="/create">
                      <Button className="mt-4 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105">Create Post</Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="saved" className="mt-0">
                {savedLoading ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                ) : savedPosts && savedPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {savedPosts.map((saved: any, index: number) => (
                      <Link
                        key={saved.id}
                        to={`/post/${saved.post_id}`}
                        className="aspect-square relative group overflow-hidden animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={saved.posts?.image_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Bookmark className="w-8 h-8 text-primary fill-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-fade-in">
                    <Bookmark className="w-12 h-12 mb-4 animate-bounce-gentle" />
                    <h3 className="font-semibold text-lg mb-1">Save</h3>
                    <p className="text-sm text-center max-w-sm">
                      Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          /* Private Account Notice */
          <PrivateAccountNotice username={profile.username} userId={profile.id} />
        )}

        {/* Followers List Sheet */}
        {profile && (
          <FollowListSheet
            open={followersOpen}
            onOpenChange={setFollowersOpen}
            userId={profile.id}
            type="followers"
            username={profile.username}
          />
        )}

        {/* Following List Sheet */}
        {profile && (
          <FollowListSheet
            open={followingOpen}
            onOpenChange={setFollowingOpen}
            userId={profile.id}
            type="following"
            username={profile.username}
          />
        )}

        {/* Follow Requests Sheet */}
        {isOwnProfile && (
          <FollowRequestsSheet
            open={followRequestsOpen}
            onOpenChange={setFollowRequestsOpen}
          />
        )}

        {/* Edit Profile Dialog */}
        {isOwnProfile && profile && (
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={profile}
          />
        )}

        {/* Avatar Editor Dialog */}
        {isOwnProfile && (
          <AvatarEditorDialog
            open={avatarEditorOpen}
            onOpenChange={setAvatarEditorOpen}
          />
        )}

        {/* Report User Dialog */}
        {!isOwnProfile && profile && (
          <ReportUserDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            userId={profile.id}
            username={profile.username}
          />
        )}
        </div>
      </PullToRefresh>

      {/* Profile Photo Viewer - Full screen with blur */}
      {photoViewerOpen && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
          onClick={() => setPhotoViewerOpen(false)}
        >
          {/* Blurred background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${profile.avatar_url})`,
              filter: 'blur(40px)',
              transform: 'scale(1.1)',
              opacity: 0.7,
            }}
          />
          <div className="absolute inset-0 bg-background/50" />
          
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            onClick={() => setPhotoViewerOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo */}
          <div
            className="relative z-10 w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Profile;
