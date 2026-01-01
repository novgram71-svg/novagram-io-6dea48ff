import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ArrowLeft, MoreVertical, Search, Sparkles } from 'lucide-react';
import { useLocation, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage, Conversation, MessageWithProfile } from '@/hooks/useMessages';
import { useProfileById } from '@/hooks/useProfiles';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useUserPresence, useUpdatePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ActiveStatus from '@/components/chat/ActiveStatus';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatAttachment from '@/components/chat/ChatAttachment';
import AttachmentPreview from '@/components/chat/AttachmentPreview';
import MessageSearchSheet from '@/components/chat/MessageSearchSheet';
import NotesBubble from '@/components/chat/NotesBubble';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const { isOnline, lastSeen } = useUserPresence(conversation.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 hover:bg-secondary/80 transition-all duration-300 animate-slide-up group',
        isSelected && 'bg-gradient-to-r from-primary/10 to-accent/5 border-l-2 border-primary'
      )}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 transition-all duration-300 group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/30">
          <AvatarImage src={conversation.avatar_url || ''} alt={conversation.username} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">{conversation.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        {/* Online indicator dot */}
        <ActiveStatus 
          isOnline={isOnline} 
          lastSeen={lastSeen} 
          showDot 
          className="absolute bottom-0 right-0"
        />
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in shadow-lg shadow-primary/30">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{conversation.username}</p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: false })}
          </span>
        </div>
        <p className={cn(
          'text-sm truncate transition-colors',
          conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}>
          {conversation.lastMessage}
        </p>
      </div>
    </button>
  );
};

const Messages = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: 'image' | 'file' } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user ID from navigation state (when coming from profile)
  const stateUserId = location.state?.selectedUserId;
  const stateUsername = location.state?.selectedUsername;
  
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConversation?.id || null);
  const { data: profileFromState } = useProfileById(stateUserId);
  const sendMessage = useSendMessage();
  const { isPartnerTyping, setTyping } = useTypingIndicator(selectedConversation?.id || null);
  const { isOnline, lastSeen } = useUserPresence(selectedConversation?.id || null);
  
  // Fetch reactions for all messages in the conversation
  const messageIds = messages?.map(m => m.id) || [];
  const { data: allReactions } = useQuery({
    queryKey: ['all-message-reactions', messageIds.join(',')],
    queryFn: async () => {
      if (messageIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);
      
      if (error) throw error;
      return data;
    },
    enabled: messageIds.length > 0,
  });
  
  // Process reactions into a map by message_id
  const reactionsMap = useMemo(() => {
    if (!allReactions || !user) return {};
    
    const map: Record<string, { emoji: string; count: number; hasUserReacted: boolean }[]> = {};
    
    allReactions.forEach(reaction => {
      if (!map[reaction.message_id]) {
        map[reaction.message_id] = [];
      }
      
      const existing = map[reaction.message_id].find(r => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        if (reaction.user_id === user.id) {
          existing.hasUserReacted = true;
        }
      } else {
        map[reaction.message_id].push({
          emoji: reaction.emoji,
          count: 1,
          hasUserReacted: reaction.user_id === user.id,
        });
      }
    });
    
    return map;
  }, [allReactions, user]);
  
  // Update own presence
  useUpdatePresence();

  // Handle navigation from profile page
  useEffect(() => {
    if (stateUserId && profileFromState && !selectedConversation) {
      // Check if conversation already exists
      const existingConversation = conversations?.find(c => c.id === stateUserId);
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        // Create a new conversation object for UI
        setSelectedConversation({
          id: stateUserId,
          username: profileFromState.username,
          avatar_url: profileFromState.avatar_url,
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        });
      }
    }
  }, [stateUserId, profileFromState, conversations, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !selectedConversation) return;
    
    setTyping(false);
    await sendMessage.mutateAsync({
      receiverId: selectedConversation.id,
      content: newMessage,
      imageUrl: attachment?.type === 'image' ? attachment.url : undefined,
      fileUrl: attachment?.type === 'file' ? attachment.url : undefined,
      fileName: attachment?.name,
    });
    
    setNewMessage('');
    setAttachment(null);
  };

  const handleFileSelect = (file: { url: string; name: string; type: 'image' | 'file' }) => {
    setAttachment(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-80px)] md:h-screen flex">
        {/* Conversations List */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r border-border bg-card/50 flex flex-col',
            selectedConversation && 'hidden md:flex'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-background to-card/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
              <h1 className="text-xl font-bold gradient-text">Messages</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200 hover:scale-110"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {/* Notes Section */}
          <div className="border-b border-border">
            <NotesBubble />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-32 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ConversationItem 
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground animate-fade-in">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start messaging someone!</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-background',
            !selectedConversation && 'hidden md:flex'
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <Avatar className="w-10 h-10 transition-transform hover:scale-105">
                      <AvatarImage src={selectedConversation.avatar_url || ''} alt={selectedConversation.username} />
                      <AvatarFallback>{selectedConversation.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <ActiveStatus 
                      isOnline={isOnline} 
                      lastSeen={lastSeen} 
                      showDot 
                      className="absolute bottom-0 right-0"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedConversation.username}</p>
                    {isPartnerTyping ? (
                      <p className="text-xs text-primary">typing...</p>
                    ) : (
                      <ActiveStatus isOnline={isOnline} lastSeen={lastSeen} />
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                        <Skeleton className="w-48 h-12 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message}
                      reactions={reactionsMap[message.id] || []}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground py-12 animate-fade-in">
                    <p className="text-center">No messages yet. Say hello!</p>
                  </div>
                )}
                {isPartnerTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card/50">
                {/* Attachment Preview */}
                {attachment && (
                  <div className="mb-2">
                    <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ChatAttachment onFileSelect={handleFileSelect} />
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 nova-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !attachment) || sendMessage.isPending}
                    className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground animate-fade-in">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-muted flex items-center justify-center">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Your Messages</h3>
                <p className="text-sm">Send private messages to your friends</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Search Sheet */}
      <MessageSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectMessage={(partnerId) => {
          const conv = conversations?.find(c => c.id === partnerId);
          if (conv) {
            setSelectedConversation(conv);
          }
        }}
      />
    </MainLayout>
  );
};

export default Messages;
