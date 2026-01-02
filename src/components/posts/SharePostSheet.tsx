import { useState } from 'react';
import { Link2, Send, Copy, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SharePostSheetProps {
  postId: string;
  isPublic: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SharePostSheet = ({ postId, isPublic, open, onOpenChange }: SharePostSheetProps) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;

  const { data: followers = [] } = useQuery({
    queryKey: ['followers-for-share', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get users the current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!following || following.length === 0) return [];

      const followingIds = following.map(f => f.following_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', followingIds);

      return profiles || [];
    },
    enabled: !!user && open,
  });

  const filteredFollowers = followers.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendToUsers = async () => {
    if (!user || selectedUsers.length === 0) return;
    
    setSending(true);
    try {
      const messages = selectedUsers.map(receiverId => ({
        sender_id: user.id,
        receiver_id: receiverId,
        content: '',
        shared_post_id: postId,
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) throw error;

      toast.success(`Shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`);
      setSelectedUsers([]);
      onOpenChange(false);
    } catch {
      toast.error('Failed to share post');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>Share Post</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Copy Link Section */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
            <Link2 className="w-5 h-5 text-muted-foreground" />
            <Input 
              value={postUrl} 
              readOnly 
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {!isPublic && (
            <p className="text-sm text-muted-foreground text-center bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
              This is a private post. Only logged-in followers can view it.
            </p>
          )}

          {/* Share to Novagram Users */}
          {user && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Share with Novagram users</p>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted"
                />
              </div>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredFollowers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery ? 'No users found' : 'Follow users to share posts with them'}
                    </p>
                  ) : (
                    filteredFollowers.map((follower) => (
                      <button
                        key={follower.id}
                        onClick={() => toggleUserSelection(follower.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedUsers.includes(follower.id)
                            ? 'bg-primary/10 border border-primary'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={follower.avatar_url || ''} />
                          <AvatarFallback>{follower.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium flex-1 text-left">{follower.username}</span>
                        {selectedUsers.includes(follower.id) && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedUsers.length > 0 && (
                <Button 
                  className="w-full" 
                  onClick={handleSendToUsers}
                  disabled={sending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                </Button>
              )}
            </>
          )}

          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Log in to share posts directly with other users
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SharePostSheet;
