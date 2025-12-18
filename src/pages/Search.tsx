import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllProfiles, useIsFollowing, useToggleFollow } from '@/hooks/useProfiles';
import { Skeleton } from '@/components/ui/skeleton';

const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const { data: profiles, isLoading } = useAllProfiles();
  const toggleFollow = useToggleFollow();

  const filteredUsers = query && profiles
    ? profiles.filter(profile =>
        profile.username.toLowerCase().includes(query.toLowerCase()) ||
        (profile.bio && profile.bio.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold mb-3">Search</h1>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
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
          </div>
        </header>

        {/* Desktop Search */}
        <div className="hidden md:block p-6">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
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
        </div>

        {/* Search Results */}
        <div className="p-4">
          {query ? (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
              </h2>
              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="w-24 h-4 mb-2" />
                        <Skeleton className="w-32 h-3" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredUsers.map((profile) => (
                    <UserSearchItem 
                      key={profile.id} 
                      profile={profile} 
                      currentUserId={user?.id}
                    />
                  ))
                )}
                {!isLoading && filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground animate-fade-in">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found for "{query}"</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Search for Novagram users</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

interface UserSearchItemProps {
  profile: {
    id: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
  };
  currentUserId?: string;
}

const UserSearchItem = ({ profile, currentUserId }: UserSearchItemProps) => {
  const { data: isFollowing } = useIsFollowing(profile.id);
  const toggleFollow = useToggleFollow();
  const isOwnProfile = currentUserId === profile.id;

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow.mutate({ targetUserId: profile.id, isFollowing: isFollowing || false });
  };

  return (
    <Link
      to={`/profile/${profile.username}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all duration-200 animate-fade-in hover:scale-[1.01]"
    >
      <Avatar className="w-12 h-12">
        <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{profile.username}</p>
        <p className="text-sm text-muted-foreground truncate">{profile.bio || 'No bio'}</p>
      </div>
      {currentUserId && !isOwnProfile && (
        <Button
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          onClick={handleFollow}
          disabled={toggleFollow.isPending}
          className="transition-all duration-200 hover:scale-105"
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      )}
    </Link>
  );
};

export default Search;
