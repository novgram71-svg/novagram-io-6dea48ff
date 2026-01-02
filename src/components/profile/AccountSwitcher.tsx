import { useState, useEffect } from 'react';
import { ChevronDown, Plus, LogOut, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLinkedAccounts, useRemoveLinkedAccount } from '@/hooks/useLinkedAccounts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountSwitcherProps {
  username: string;
  avatarUrl?: string | null;
}

const AccountSwitcher = ({ username, avatarUrl }: AccountSwitcherProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: linkedAccounts = [] } = useLinkedAccounts();
  const removeAccount = useRemoveLinkedAccount();

  const handleAddAccount = () => {
    setOpen(false);
    // Store current account info in localStorage before signing out
    if (user) {
      const currentAccount = {
        userId: user.id,
        email: user.email,
        username,
        avatarUrl
      };
      localStorage.setItem('pending_link_account', JSON.stringify(currentAccount));
    }
    signOut();
    navigate('/auth');
  };

  const handleSwitchAccount = async (linkedUserId: string, linkedUsername: string) => {
    setOpen(false);
    
    // Try to use stored session for seamless switching
    const storedSessions = JSON.parse(localStorage.getItem('account_sessions') || '{}');
    const storedSession = storedSessions[linkedUserId];
    
    if (storedSession) {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token,
        });
        
        if (!error) {
          toast({
            title: "Switched account",
            description: `You are now logged in as ${linkedUsername}`,
          });
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error switching account:', error);
      }
    }
    
    // Fallback to manual login if no stored session
    toast({
      title: "Session expired",
      description: "Please sign in again",
    });
    await signOut();
    navigate('/auth');
  };

  const handleRemoveLinkedAccount = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    await removeAccount.mutateAsync(accountId);
    toast({
      title: "Account removed",
      description: "The linked account has been removed",
    });
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-1 outline-none">
        <h1 className="text-lg font-bold">{username}</h1>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {/* Current account */}
        <DropdownMenuItem className="flex items-center gap-3 p-3" disabled>
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl || ''} alt={username} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{username}</p>
            <p className="text-xs text-muted-foreground">Current account</p>
          </div>
          <Check className="w-5 h-5 text-primary" />
        </DropdownMenuItem>
        
        {/* Linked accounts */}
        {linkedAccounts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {linkedAccounts.map((account) => (
              <DropdownMenuItem 
                key={account.id}
                onClick={() => handleSwitchAccount(account.linked_user_id, account.linked_username)}
                className="flex items-center gap-3 p-3 group"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={account.linked_avatar_url || ''} alt={account.linked_username} />
                  <AvatarFallback>{account.linked_username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{account.linked_username}</p>
                  <p className="text-xs text-muted-foreground">{account.linked_email}</p>
                </div>
                <button 
                  onClick={(e) => handleRemoveLinkedAccount(e, account.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleAddAccount} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="font-medium">Add account</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 p-3 text-destructive">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher;