import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Image, MessageSquare, Download, ChevronRight, AlertTriangle, Ban, CheckCircle, XCircle, Bot, Eye, KeyRound, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAllUsers, useAllPosts, useConversationPartners, useConversation } from '@/hooks/useAdmin';
import { useAllReports, useUpdateReportStatus, useAllBannedUsers, useBanUser, useUnbanUser } from '@/hooks/useUserModeration';
import { useAIAbuseReports } from '@/hooks/useAIAbuseReports';
import { usePasswordResetRequests } from '@/hooks/usePasswordReset';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: posts, isLoading: postsLoading } = useAllPosts();
  const { data: reports, isLoading: reportsLoading } = useAllReports();
  const { data: bannedUsers, isLoading: bannedLoading } = useAllBannedUsers();
  const { reports: aiReports, isLoading: aiReportsLoading, markReviewed } = useAIAbuseReports();
  const { requests: resetRequests, isLoading: resetLoading, approveRequest, rejectRequest } = usePasswordResetRequests();
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string | null>(null);
  
  const { data: chatPartners } = useConversationPartners(selectedUser);
  const { data: conversation } = useConversation(selectedUser, selectedChatPartner);
  
  const updateReportStatus = useUpdateReportStatus();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const selectedUserProfile = users?.find(u => u.id === selectedUser);
  const selectedPartnerProfile = chatPartners?.find((p: any) => p.id === selectedChatPartner);
  
  const bannedUserIds = new Set(bannedUsers?.map((b: any) => b.user_id) || []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingReportsCount = reports?.filter((r: any) => r.status === 'pending').length || 0;
  const unreviewedAIReportsCount = aiReports?.filter(r => !r.reviewed).length || 0;
  const pendingResetCount = resetRequests?.length || 0;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto pb-8">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, posts, reports, and messages</p>
          </div>
        </header>

        <Tabs defaultValue="users" className="p-4">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <Image className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 relative">
              <AlertTriangle className="w-4 h-4" />
              Reports
              {pendingReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingReportsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="ai-reports" className="gap-2 relative">
              <Bot className="w-4 h-4" />
              AI Reports
              {unreviewedAIReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreviewedAIReportsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="password-resets" className="gap-2 relative">
              <KeyRound className="w-4 h-4" />
              Password Resets
              {pendingResetCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingResetCount}
                </span>
              )}
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
                      users?.map((u) => {
                        const isBanned = bannedUserIds.has(u.id);
                        return (
                          <div
                            key={u.id}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-colors animate-fade-in ${
                              isBanned ? 'bg-destructive/10' : 'bg-secondary/50 hover:bg-secondary'
                            }`}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={u.avatar_url || ''} />
                              <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{u.username}</p>
                                {isBanned && (
                                  <Badge variant="destructive" className="text-xs">Banned</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{u.email || 'No email'}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Joined {formatDistanceToNow(new Date(u.created_at))} ago</p>
                            </div>
                            <div className="flex gap-2">
                              {isBanned ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-green-500 hover:text-green-600">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Unban
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Unban {u.username}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will restore their access to the platform.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => unbanUser.mutate({ userId: u.id })}>
                                        Unban
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                u.id !== user.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                        <Ban className="w-4 h-4 mr-1" />
                                        Ban
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Ban {u.username}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will prevent this user from accessing the platform.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => banUser.mutate({ userId: u.id })}
                                        >
                                          Ban User
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })
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

          {/* Reports Tab */}
          <TabsContent value="reports" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  User Reports ({reports?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {reportsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))
                    ) : reports && reports.length > 0 ? (
                      reports.map((report: any) => {
                        const reportedIsBanned = bannedUserIds.has(report.reported_user_id);
                        return (
                          <div
                            key={report.id}
                            className="p-4 rounded-xl bg-secondary/50 border border-border animate-fade-in"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={report.reported?.avatar_url || ''} />
                                  <AvatarFallback>{report.reported?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{report.reported?.username}</p>
                                    {reportedIsBanned && (
                                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Reported by @{report.reporter?.username}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(report.status)}
                            </div>

                            <div className="mb-3">
                              <p className="text-sm font-medium capitalize">{report.reason.replace('_', ' ')}</p>
                              {report.description && (
                                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(report.created_at))} ago
                              </p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              {report.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReportStatus.mutate({ reportId: report.id, status: 'resolved' })}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Resolve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReportStatus.mutate({ reportId: report.id, status: 'dismissed' })}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Dismiss
                                  </Button>
                                </>
                              )}
                              {!reportedIsBanned && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Ban className="w-4 h-4 mr-1" />
                                      Ban User
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Ban {report.reported?.username}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will prevent this user from accessing the platform.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => {
                                          banUser.mutate({ userId: report.reported_user_id, reason: report.reason });
                                          updateReportStatus.mutate({ reportId: report.id, status: 'resolved' });
                                        }}
                                      >
                                        Ban User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No reports yet</p>
                      </div>
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
                      {users?.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u.id);
                            setSelectedChatPartner(null);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            selectedUser === u.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.avatar_url || ''} />
                            <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{u.username}</span>
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

          {/* AI Abuse Reports Tab */}
          <TabsContent value="ai-reports" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Content Reports ({aiReports?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {aiReportsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))
                    ) : aiReports && aiReports.length > 0 ? (
                      aiReports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-4 rounded-xl border animate-fade-in ${
                            report.reviewed 
                              ? 'bg-muted/30 border-muted' 
                              : 'bg-destructive/5 border-destructive/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={report.severity === 'high' ? 'destructive' : 'outline'}
                                className={
                                  report.severity === 'high' 
                                    ? '' 
                                    : report.severity === 'medium'
                                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                      : 'bg-muted text-muted-foreground'
                                }
                              >
                                {report.severity} severity
                              </Badge>
                              {report.reviewed && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  Reviewed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(report.created_at))} ago
                            </p>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Detected Issues:</p>
                            <div className="flex flex-wrap gap-1">
                              {report.detected_issues?.map((issue, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mb-3 p-3 bg-secondary/50 rounded-lg">
                            <p className="text-sm font-medium mb-1">Message Content:</p>
                            <p className="text-sm text-muted-foreground break-words">
                              {report.message_content}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {!report.reviewed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markReviewed(report.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Mark Reviewed
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Ban className="w-4 h-4 mr-1" />
                                  Ban User
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban this user?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent this user from accessing the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                      banUser.mutate({ userId: report.user_id, reason: 'AI detected abusive language' });
                                      markReviewed(report.id);
                                    }}
                                  >
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground animate-fade-in">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No AI abuse reports yet</p>
                        <p className="text-sm mt-2">Reports from Nova AI will appear here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Reset Requests Tab */}
          <TabsContent value="password-resets" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Password Reset Requests ({resetRequests?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {resetLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))
                    ) : resetRequests && resetRequests.length > 0 ? (
                      resetRequests.map((request: any) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-xl bg-secondary/50 border border-border animate-fade-in"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={request.profiles?.avatar_url || ''} />
                                <AvatarFallback>
                                  {request.profiles?.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{request.profiles?.username || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {request.profiles?.email || 'No email'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Pending
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            Requested {formatDistanceToNow(new Date(request.created_at))} ago
                          </p>

                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveRequest.mutate(request.id)}
                              disabled={approveRequest.isPending}
                            >
                              {approveRequest.isPending ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectRequest.mutate(request.id)}
                              disabled={rejectRequest.isPending}
                            >
                              {rejectRequest.isPending ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground animate-fade-in">
                        <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No pending password reset requests</p>
                        <p className="text-sm mt-2">User password reset requests will appear here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
