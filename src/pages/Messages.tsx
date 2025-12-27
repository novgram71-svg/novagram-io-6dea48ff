import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { useLocation, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage, Conversation } from '@/hooks/useMessages';
import { useProfileById } from '@/hooks/useProfiles';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useUserPresence, useUpdatePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ActiveStatus from '@/components/chat/ActiveStatus';
import ReadReceipt from '@/components/chat/ReadReceipt';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
        'w-full flex items-center gap-3 p-4 hover:bg-secondary transition-all duration-200 animate-fade-in',
        isSelected && 'bg-secondary'
      )}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 transition-transform hover:scale-105">
          <AvatarImage src={conversation.avatar_url || ''} alt={conversation.username} />
          <AvatarFallback>{conversation.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        {/* Online indicator dot */}
        <ActiveStatus 
          isOnline={isOnline} 
          lastSeen={lastSeen} 
          showDot 
          className="absolute bottom-0 right-0"
        />
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">{conversation.username}</p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: false })}
          </span>
        </div>
        <p className={cn(
          'text-sm truncate',
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
    if (!newMessage.trim() || !selectedConversation) return;
    
    setTyping(false);
    await sendMessage.mutateAsync({
      receiverId: selectedConversation.id,
      content: newMessage,
    });
    
    setNewMessage('');
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
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold">Messages</h1>
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
                  messages.map((message, index) => {
                    const isOwn = message.sender_id === user.id;
                    const isLastOwnMessage = isOwn && 
                      messages.slice(index + 1).every(m => m.sender_id !== user.id);
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className="flex flex-col items-end">
                          <div
                            className={cn(
                              'max-w-[70%] px-4 py-2 rounded-2xl animate-fade-in',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={cn(
                              'text-xs',
                              isOwn ? 'text-muted-foreground' : 'text-muted-foreground'
                            )}>
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <ReadReceipt 
                                sent={true} 
                                read={message.read} 
                                readAt={(message as any).read_at}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 nova-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessage.isPending}
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
    </MainLayout>
  );
};

export default Messages;
