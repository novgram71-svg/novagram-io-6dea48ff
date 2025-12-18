import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Banned = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <Ban className="w-10 h-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended for violating our community guidelines. 
            If you believe this is a mistake, please contact support.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={signOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          For appeals or questions, contact support@novagram.app
        </p>
      </div>
    </div>
  );
};

export default Banned;
