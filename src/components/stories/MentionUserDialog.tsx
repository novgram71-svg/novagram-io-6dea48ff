import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchProfiles } from '@/hooks/useProfiles';
import { Search, AtSign } from 'lucide-react';

interface MentionUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: { id: string; username: string }) => void;
}

const MentionUserDialog = ({ open, onOpenChange, onSelectUser }: MentionUserDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: profiles = [], isLoading } = useSearchProfiles(searchQuery);

  const handleSelectUser = (user: { id: string; username: string }) => {
    onSelectUser(user);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="w-5 h-5 text-primary" />
            Mention Someone
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {isLoading && searchQuery.length > 0 && (
                <p className="text-center text-muted-foreground py-4">Searching...</p>
              )}
              
              {!isLoading && searchQuery.length > 0 && profiles.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}

              {searchQuery.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Start typing to search for users
                </p>
              )}

              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectUser({ id: profile.id, username: profile.username })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{profile.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentionUserDialog;
