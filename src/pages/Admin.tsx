import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Image, MessageSquare, Download, ChevronRight, ArrowLeft, Eye } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAllUsers, useAllPosts, useConversationPartners, useConversation } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: posts, isLoading: postsLoading } = useAllPosts();
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string | null>(null);
  
  const { data: chatPartners } = useConversationPartners(selectedUser);
  const { data: conversation } = useConversation(selectedUser, selectedChatPartner);

  const selectedUserProfile = users?.find(u => u.id === selectedUser);
  const selectedPartnerProfile = chatPartners?.find((p: any) => p.id === selectedChatPartner);

  if (authLoading || adminLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
        </div>
      </MainLayout>
    );
  }

  const downloadChat = () => {
    if (!conversation || !selectedUserProfile || !selectedPartnerProfile) return;

    const chatText = conversation.map((msg: any) => {
      const sender = msg.sender_id === selectedUser ? selectedUserProfile.username : selectedPartnerProfile.username;
      const time = new Date(msg.created_at).toLocaleString();
      return `[${time}] ${sender}: ${msg.content}`;
    }).join('\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${selectedUserProfile.username}_${selectedPartnerProfile.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto pb-8">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, posts, and messages</p>
          </div>
        </header>

        <Tabs defaultValue="users" className="p-4">
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <Image className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chats
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Users ({users?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-3">
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))
                    ) : (
                      users?.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Joined {formatDistanceToNow(new Date(user.created_at))} ago</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  All Posts ({posts?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {postsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square" />
                      ))
                    ) : (
                      posts?.map((post: any) => (
                        <div
                          key={post.id}
                          className="relative group overflow-hidden rounded-xl animate-fade-in"
                        >
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={post.profiles?.avatar_url || ''} />
                                <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{post.profiles?.username}</span>
                            </div>
                            {post.caption && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.caption}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats" className="animate-fade-in">
            <div className="grid md:grid-cols-3 gap-4">
              {/* User Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select User</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-2">
                      {users?.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user.id);
                            setSelectedChatPartner(null);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            selectedUser === user.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{user.username}</span>
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Partners */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {selectedUserProfile ? `${selectedUserProfile.username}'s Chats` : 'Select a user'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[50vh]">
                    {selectedUser ? (
                      chatPartners && chatPartners.length > 0 ? (
                        <div className="space-y-2">
                          {chatPartners.map((partner: any) => (
                            <button
                              key={partner.id}
                              onClick={() => setSelectedChatPartner(partner.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                selectedChatPartner === partner.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                              }`}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={partner.avatar_url || ''} />
                                <AvatarFallback>{partner.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate">{partner.username}</span>
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No conversations</p>
                      )
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Select a user first</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Conversation View */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">
                    {selectedPartnerProfile 
                      ? `Chat with ${selectedPartnerProfile.username}` 
                      : 'Select a conversation'}
                  </CardTitle>
                  {conversation && conversation.length > 0 && (
                    <Button size="sm" variant="outline" onClick={downloadChat}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[50vh]">
                    {conversation && conversation.length > 0 ? (
                      <div className="space-y-3">
                        {conversation.map((msg: any) => {
                          const isFromSelected = msg.sender_id === selectedUser;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isFromSelected ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-xl ${
                                  isFromSelected 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-secondary'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {formatDistanceToNow(new Date(msg.created_at))} ago
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedChatPartner ? (
                      <p className="text-center text-muted-foreground py-8">No messages</p>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Select a conversation</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
