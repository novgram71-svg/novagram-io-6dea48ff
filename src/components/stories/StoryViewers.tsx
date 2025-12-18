import { Eye } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface StoryViewersProps {
  storyId: string;
  viewCount: number;
}

const StoryViewers = ({ storyId, viewCount }: StoryViewersProps) => {
  const { data: viewers, isLoading } = useQuery({
    queryKey: ['storyViewers', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          *,
          viewer:profiles!story_views_viewer_id_fkey(id, username, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
          <Eye className="w-5 h-5" />
          <span>{viewCount}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Viewers ({viewCount})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-60px)] py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : viewers && viewers.length > 0 ? (
            <div className="space-y-3">
              {viewers.map((view: any) => (
                <Link
                  key={view.id}
                  to={`/profile/${view.viewer.username}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={view.viewer.avatar_url || ''} />
                    <AvatarFallback>{view.viewer.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{view.viewer.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(view.viewed_at))} ago
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No viewers yet</p>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default StoryViewers;
