import { useState } from 'react';
import { Grid3X3, Bookmark, Settings, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { currentUser, mockPosts } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const Profile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = true; // Would be determined by auth
  const userPosts = mockPosts.slice(0, 6); // Mock posts for this user

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
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-8">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold">{currentUser.username}</h1>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
            {/* Avatar */}
            <div className="story-ring p-1">
              <Avatar className="w-24 h-24 md:w-36 md:h-36 border-4 border-background">
                <AvatarImage src={currentUser.profilePhoto} alt={currentUser.username} />
                <AvatarFallback className="text-2xl">{currentUser.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{currentUser.username}</h2>
                
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Edit Profile
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsFollowing(!isFollowing)}
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
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-4">
                <div className="text-center">
                  <span className="font-bold block">{currentUser.postCount}</span>
                  <span className="text-sm text-muted-foreground">posts</span>
                </div>
                <button className="text-center hover:opacity-80 transition-opacity">
                  <span className="font-bold block">{formatCount(currentUser.followersCount)}</span>
                  <span className="text-sm text-muted-foreground">followers</span>
                </button>
                <button className="text-center hover:opacity-80 transition-opacity">
                  <span className="font-bold block">{formatCount(currentUser.followingCount)}</span>
                  <span className="text-sm text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio */}
              <p className="text-sm whitespace-pre-line">{currentUser.bio}</p>
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
            <TabsTrigger 
              value="saved" 
              className="flex items-center gap-2 data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">SAVED</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {userPosts.map((post) => (
                <button
                  key={post.id}
                  className="aspect-square relative group overflow-hidden"
                >
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      ❤️ {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      💬 {post.commentCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bookmark className="w-12 h-12 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Save</h3>
              <p className="text-sm text-center max-w-sm">
                Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;
