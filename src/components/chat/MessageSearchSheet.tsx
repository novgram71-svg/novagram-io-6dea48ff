import { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMessage?: (partnerId: string) => void;
}

const MessageSearchSheet = ({ open, onOpenChange, onSelectMessage }: MessageSearchSheetProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['message-search', searchQuery, user?.id],
    queryFn: async () => {
      if (!user || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user && searchQuery.length >= 2,
  });

  const handleSelectResult = (message: any) => {
    const partnerId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
    onSelectMessage?.(partnerId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Search Messages</SheetTitle>
        </SheetHeader>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search in messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-160px)]">
          {searchQuery.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enter at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="divide-y divide-border">
              {results.map((message) => {
                const partner = message.sender_id === user?.id ? message.receiver : message.sender;
                const isOwn = message.sender_id === user?.id;
                
                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectResult(message)}
                    className="w-full p-4 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={partner.avatar_url || ''} alt={partner.username} />
                        <AvatarFallback>{partner.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{partner.username}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {isOwn && <span className="text-foreground">You: </span>}
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No messages found for "{searchQuery}"</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MessageSearchSheet;