import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SavedPostsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavedPostsSheet = ({ open, onOpenChange }: SavedPostsSheetProps) => {
  const { savedPosts, isLoading } = useSavedPosts();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Saved Posts
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bookmark className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No saved posts yet</p>
              <p className="text-sm">Posts you save will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {savedPosts.map((saved: any) => (
                <Link
                  key={saved.id}
                  to={`/post/${saved.post_id}`}
                  onClick={() => onOpenChange(false)}
                  className="relative group aspect-square overflow-hidden rounded-md animate-fade-in"
                >
                  <img
                    src={saved.posts?.image_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-white fill-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
