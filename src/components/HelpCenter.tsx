import { useState } from 'react';
import { HelpCircle, X, Search, ChevronRight, Shield, User, Bell, Lock, CreditCard, MessageCircle, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface HelpTopic {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  articles: { title: string; content: string }[];
}

const helpTopics: HelpTopic[] = [
  {
    id: 'account',
    icon: User,
    title: 'Account Settings',
    description: 'Manage your profile and personal information',
    articles: [
      { title: 'How to edit my profile', content: 'Go to your profile page and tap "Edit Profile" to update your bio, username, and profile picture.' },
      { title: 'How to change my username', content: 'Navigate to Settings > Edit Profile > Username. Note: You can only change your username once every 14 days.' },
      { title: 'How to delete my account', content: 'Go to Settings > Account > Delete Account. This action is permanent and cannot be undone.' },
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy & Security',
    description: 'Control who can see your content and activity',
    articles: [
      { title: 'How to make my account private', content: 'Go to Settings and toggle on "Private Account". Only approved followers will see your posts.' },
      { title: 'How to block someone', content: 'Visit their profile, tap the three dots menu, and select "Block". They won\'t be able to see your profile or posts.' },
      { title: 'How to report a user', content: 'Visit their profile, tap the three dots menu, and select "Report". Choose a reason and submit.' },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Customize your notification preferences',
    articles: [
      { title: 'How to turn off notifications', content: 'Go to Settings > Notifications and toggle off the types of notifications you don\'t want to receive.' },
      { title: 'Push notification not working', content: 'Ensure notifications are enabled in your device settings and in the app. Try logging out and back in.' },
    ],
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'Messages',
    description: 'Learn about messaging features',
    articles: [
      { title: 'How to send a message', content: 'Go to a user\'s profile and tap "Message", or go to the Messages tab and start a new conversation.' },
      { title: 'How to delete a message', content: 'Long press or hover on your message and select "Delete". This only removes it from your view.' },
      { title: 'Read receipts', content: 'Blue checkmarks indicate your message has been read. You can disable read receipts in Settings.' },
    ],
  },
  {
    id: 'safety',
    icon: Shield,
    title: 'Safety Center',
    description: 'Report issues and stay safe online',
    articles: [
      { title: 'How to report content', content: 'Tap the three dots on any post and select "Report". Choose a reason and our team will review it.' },
      { title: 'Someone is harassing me', content: 'Block the user immediately and report them. If you feel unsafe, contact local authorities.' },
      { title: 'I found a bug', content: 'Please report bugs through Settings > Help > Report a Problem.' },
    ],
  },
  {
    id: 'troubleshooting',
    icon: AlertTriangle,
    title: 'Troubleshooting',
    description: 'Fix common issues',
    articles: [
      { title: 'App is running slow', content: 'Try clearing the app cache, checking your internet connection, or reinstalling the app.' },
      { title: 'Can\'t upload photos', content: 'Ensure you\'ve granted camera and storage permissions. Check your internet connection.' },
      { title: 'Feed not refreshing', content: 'Pull down to refresh. If that doesn\'t work, try logging out and back in.' },
    ],
  },
];

const HelpCenter = () => {
  const [open, setOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; content: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = helpTopics.filter(topic => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(lowerQuery) ||
      topic.description.toLowerCase().includes(lowerQuery) ||
      topic.articles.some(a => a.title.toLowerCase().includes(lowerQuery))
    );
  });

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedTopic) {
      setSelectedTopic(null);
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
            size="icon"
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {(selectedTopic || selectedArticle) && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  ← Back
                </Button>
              )}
              <SheetTitle className="flex-1 text-center">
                {selectedArticle ? selectedArticle.title : selectedTopic ? selectedTopic.title : 'Help Center'}
              </SheetTitle>
              <div className="w-12" />
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            {!selectedTopic && !selectedArticle && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Topics */}
                <div className="space-y-2">
                  {filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <topic.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{topic.title}</p>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {filteredTopics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {selectedTopic && !selectedArticle && (
              <div className="p-4 space-y-2">
                {selectedTopic.articles.map((article, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <p className="font-medium">{article.title}</p>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {selectedArticle && (
              <div className="p-4">
                <p className="text-muted-foreground leading-relaxed">{selectedArticle.content}</p>
                
                <div className="mt-8 p-4 bg-secondary rounded-lg">
                  <p className="font-medium mb-2">Was this helpful?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Yes</Button>
                    <Button variant="outline" size="sm">No</Button>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default HelpCenter;