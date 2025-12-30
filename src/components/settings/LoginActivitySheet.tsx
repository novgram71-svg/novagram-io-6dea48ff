import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLoginActivity } from '@/hooks/useLoginActivity';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Monitor, Globe, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface LoginActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginActivitySheet = ({ open, onOpenChange }: LoginActivitySheetProps) => {
  const { loginActivity, isLoading } = useLoginActivity();

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Globe className="w-5 h-5" />;
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Login Activity
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : loginActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No login activity</p>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {activity.device_info || 'Unknown device'}
                      </p>
                      {activity.is_current && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Current
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
