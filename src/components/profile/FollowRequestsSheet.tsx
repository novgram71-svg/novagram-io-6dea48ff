import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, UserPlus, Loader2 } from 'lucide-react';
import { useFollowRequests } from '@/hooks/useFollowRequests';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface FollowRequestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FollowRequestsSheet = ({ open, onOpenChange }: FollowRequestsSheetProps) => {
  const { receivedRequests, loadingReceived, acceptRequest, rejectRequest } = useFollowRequests();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Follow Requests
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-3">
            {loadingReceived ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="w-24 h-4 mb-2" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
              ))
            ) : receivedRequests && receivedRequests.length > 0 ? (
              receivedRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 animate-fade-in"
                >
                  <Link to={`/profile/${request.requester?.username}`}>
                    <Avatar className="w-12 h-12 transition-transform duration-200 hover:scale-110">
                      <AvatarImage src={request.requester?.avatar_url || ''} />
                      <AvatarFallback>
                        {request.requester?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${request.requester?.username}`}>
                      <p className="font-semibold text-sm hover:underline">
                        {request.requester?.username}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at))} ago
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptRequest.mutate(request.requester_id)}
                      disabled={acceptRequest.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {acceptRequest.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectRequest.mutate(request.requester_id)}
                      disabled={rejectRequest.isPending}
                    >
                      {rejectRequest.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending follow requests</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
