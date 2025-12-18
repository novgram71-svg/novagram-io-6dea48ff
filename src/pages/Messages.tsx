import { useState } from 'react';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { mockConversations, mockUsers } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderId: 'other', text: 'Hey! How are you?', timestamp: '10:30 AM' },
    { id: '2', senderId: 'current', text: "I'm great! Just working on some projects.", timestamp: '10:32 AM' },
    { id: '3', senderId: 'other', text: "That's awesome! Would love to see what you're building.", timestamp: '10:33 AM' },
    { id: '4', senderId: 'current', text: "I'll share some sneak peeks soon! 😊", timestamp: '10:35 AM' },
    { id: '5', senderId: 'other', text: "Can't wait! By the way, loved your latest post!", timestamp: '10:36 AM' },
  ]);

  const selectedUser = selectedConversation
    ? mockConversations.find(c => c.id === selectedConversation)?.user
    : null;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: 'current',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
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
            {mockConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors',
                  selectedConversation === conversation.id && 'bg-secondary'
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.user.profilePhoto} alt={conversation.user.username} />
                    <AvatarFallback>{conversation.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{conversation.user.username}</p>
                    <span className="text-xs text-muted-foreground">{conversation.lastMessage.timestamp}</span>
                  </div>
                  <p className={cn(
                    'text-sm truncate',
                    conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {conversation.lastMessage.senderId === 'current' && 'You: '}
                    {conversation.lastMessage.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-background',
            !selectedConversation && 'hidden md:flex'
          )}
        >
          {selectedConversation && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.username} />
                    <AvatarFallback>{selectedUser.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.senderId === 'current' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] px-4 py-2 rounded-2xl animate-fade-in',
                        message.senderId === 'current'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        message.senderId === 'current' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 nova-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
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
