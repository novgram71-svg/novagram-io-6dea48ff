import { useState } from 'react';
import { ChevronDown, Plus, LogOut } from 'lucide-react';
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

interface AccountSwitcherProps {
  username: string;
  avatarUrl?: string | null;
}

const AccountSwitcher = ({ username, avatarUrl }: AccountSwitcherProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleAddAccount = () => {
    setOpen(false);
    signOut();
    navigate('/auth');
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
      <DropdownMenuContent align="start" className="w-64">
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
        </DropdownMenuItem>
        
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
