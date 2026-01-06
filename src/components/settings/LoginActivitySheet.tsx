import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLoginActivity, terminateSession, terminateAllOtherSessions } from '@/hooks/useLoginActivity';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Monitor, Globe, Clock, CheckCircle, LogOut, Loader2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LoginActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginActivitySheet = ({ open, onOpenChange }: LoginActivitySheetProps) => {
  const { loginActivity, isLoading, refetch } = useLoginActivity();
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Globe className="w-5 h-5" />;
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      await terminateSession(sessionId);
      toast.success('Session terminated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to terminate session');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleLogoutAllOtherDevices = async () => {
    setIsLoggingOutAll(true);
    try {
      await terminateAllOtherSessions();
      toast.success('All other sessions have been terminated');
      refetch();
    } catch (error) {
      toast.error('Failed to terminate sessions');
    } finally {
      setIsLoggingOutAll(false);
      setShowLogoutAllDialog(false);
    }
  };

  const otherSessions = loginActivity.filter(a => !a.is_current);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Active Sessions
            </SheetTitle>
            <SheetDescription>
              Manage your active sessions across all devices
            </SheetDescription>
          </SheetHeader>

          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-4"
              onClick={() => setShowLogoutAllDialog(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out from all other devices
            </Button>
          )}
          
          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : loginActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No active sessions</p>
                <p className="text-sm">Your login history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loginActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl animate-fade-in"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getDeviceIcon(activity.device_info)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {activity.device_info || 'Unknown device'}
                        </p>
                        {activity.is_current && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs shrink-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            This device
                          </Badge>
                        )}
                      </div>
                      {activity.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" />
                          {activity.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.logged_in_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!activity.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleTerminateSession(activity.id)}
                        disabled={terminatingId === activity.id}
                      >
                        {terminatingId === activity.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out from all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all sessions except your current one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAllOtherDevices}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoggingOutAll}
            >
              {isLoggingOutAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign out all'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
