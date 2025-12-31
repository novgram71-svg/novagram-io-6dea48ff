import { useState } from 'react';
import { Search as SearchIcon, TrendingUp, Hash, X, Sparkles, Grid, Film } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useExplorePosts, useTrendingPosts } from '@/hooks/useExplorePosts';
import { useTrendingHashtags, useSearchHashtags } from '@/hooks/useHashtags';
import { useAuth } from '@/hooks/useAuth';
import { useAllProfiles } from '@/hooks/useProfiles';
import StoriesBar from '@/components/stories/StoriesBar';
import { AIChat } from '@/components/search/AIChat';

const Explore = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const { data: explorePosts, isLoading: loadingExplore } = useExplorePosts();
  const { data: trendingPosts, isLoading: loadingTrending } = useTrendingPosts();
  const { data: trendingHashtags, isLoading: loadingHashtags } = useTrendingHashtags();
  const { data: searchHashtags } = useSearchHashtags(query);
  const { data: profiles } = useAllProfiles();

  const filteredProfiles = query && profiles
    ? profiles.filter(p => 
        p.username.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header with Search */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Explore
              </h1>
              <Button
                variant={showAI ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className="gap-2 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI
              </Button>
            </div>
            
            {/* Search Bar with Hashtag Search */}
            {!showAI && (
              <div className="relative animate-fade-in">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search hashtags, users..."
                  className="pl-10 nova-input"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {showAI ? (
          <div className="p-4">
            <AIChat onClose={() => setShowAI(false)} />
          </div>
        ) : query ? (
          /* Search Results */
          <div className="p-4 space-y-6 animate-fade-in">
            {/* Hashtag Results */}
            {searchHashtags && searchHashtags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Hashtags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {searchHashtags.map((tag: any) => (
                    <button
                      key={tag.id}
                      className="px-4 py-2 bg-secondary rounded-full text-sm hover:bg-primary/20 transition-all duration-200 hover:scale-105"
                    >
                      #{tag.name}
                      <span className="ml-2 text-xs text-muted-foreground">{tag.post_count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Results */}
            {filteredProfiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Users</h3>
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/profile/${profile.username}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all duration-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{profile.username}</p>
                        <p className="text-xs text-muted-foreground">{profile.bio || 'No bio'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Explore Content */
          <div className="space-y-6">
            {/* Stories Bar */}
            <StoriesBar />

            {/* Trending Hashtags */}
            <div className="px-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 animate-fade-in">
                <Hash className="w-4 h-4" />
                Trending Hashtags
              </h3>
              <div className="flex flex-wrap gap-2 animate-fade-in stagger-1">
                {loadingHashtags ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-24 h-8 rounded-full" />
                  ))
                ) : trendingHashtags && trendingHashtags.length > 0 ? (
                  trendingHashtags.map((tag: any, index: number) => (
                    <button
                      key={tag.id}
                      className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full text-sm hover:from-primary/20 hover:to-accent/20 transition-all duration-200 hover:scale-105 border border-primary/20"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      #{tag.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No trending hashtags yet</p>
                )}
              </div>
            </div>

            {/* Posts Tabs */}
            <Tabs defaultValue="trending" className="px-4">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="explore" className="gap-2">
                  <Grid className="w-4 h-4" />
                  For You
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {loadingTrending ? (
                    Array.from({ length: 9 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))
                  ) : trendingPosts && trendingPosts.length > 0 ? (
                    trendingPosts.map((post: any, index: number) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="relative group overflow-hidden aspect-square animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.profiles?.avatar_url || ''} />
                              <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate">{post.profiles?.username}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No trending posts yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="explore" className="animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {loadingExplore ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))
                  ) : explorePosts && explorePosts.length > 0 ? (
                    explorePosts.map((post: any, index: number) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="relative group overflow-hidden aspect-square animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.profiles?.avatar_url || ''} />
                              <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate">{post.profiles?.username}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No posts to explore yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
