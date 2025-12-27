import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCloseFriends } from '@/hooks/useUserSettings';
import { useSearchProfiles } from '@/hooks/useProfiles';
import { Loader2, Search, X, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CloseFriendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CloseFriendsSheet = ({ open, onOpenChange }: CloseFriendsSheetProps) => {
  const { user } = useAuth();
  const { closeFriends, isLoading, addCloseFriend, removeCloseFriend } = useCloseFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [] } = useSearchProfiles(searchQuery);

  const closeFriendIds = closeFriends.map(cf => cf.friend_id);
  const filteredResults = searchResults.filter(
    profile => profile.id !== user?.id && !closeFriendIds.includes(profile.id)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Close Friends</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Search to add */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search to add friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchQuery && filteredResults.length > 0 && (
            <div className="space-y-2 border-b border-border pb-4">
              <p className="text-xs text-muted-foreground font-medium">Add to close friends</p>
              {filteredResults.slice(0, 5).map((profile) => (
                <div 
                  key={profile.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile.username}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      addCloseFriend(profile.id);
                      setSearchQuery('');
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Current Close Friends */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Your close friends</p>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : closeFriends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No close friends yet
              </p>
            ) : (
              closeFriends.map((friend) => {
                const profile = friend.profile;
                return (
                  <div 
                    key={friend.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{profile?.username}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCloseFriend(friend.friend_id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
