import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { mockUsers } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Search = () => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(mockUsers.slice(0, 3));

  const filteredUsers = query
    ? mockUsers.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.bio.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const clearRecentSearch = (userId: string) => {
    setRecentSearches(recentSearches.filter(u => u.id !== userId));
  };

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results or Recent */}
        <div className="p-4">
          {query ? (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
              </h2>
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors animate-fade-in"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profilePhoto} alt={user.username} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                    </div>
                    <Button
                      variant={user.isFollowing ? 'secondary' : 'default'}
                      size="sm"
                      onClick={(e) => e.preventDefault()}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </Link>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found for "{query}"</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent</h2>
                {recentSearches.length > 0 && (
                  <button
                    onClick={() => setRecentSearches([])}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recentSearches.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profilePhoto} alt={user.username} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => clearRecentSearch(user.id)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {recentSearches.length === 0 && (
                  <p className="text-center py-12 text-muted-foreground">No recent searches</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Search;
