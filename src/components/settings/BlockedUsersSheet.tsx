import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useBlockedUsers } from '@/hooks/useUserSettings';
import { Loader2 } from 'lucide-react';

interface BlockedUsersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlockedUsersSheet = ({ open, onOpenChange }: BlockedUsersSheetProps) => {
  const { blockedUsers, isLoading, unblockUser } = useBlockedUsers();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Blocked Accounts</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No blocked accounts
            </p>
          ) : (
            blockedUsers.map((blocked) => {
              const profile = blocked.profile;
              return (
                <div 
                  key={blocked.id} 
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
                    variant="outline" 
                    size="sm"
                    onClick={() => unblockUser(blocked.blocked_id)}
                  >
                    Unblock
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
