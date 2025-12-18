import { useState } from 'react';
import { Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComments, useAddComment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface CommentsSheetProps {
  postId: string;
  postOwnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommentsSheet = ({ postId, postOwnerId, open, onOpenChange }: CommentsSheetProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment.mutate(
      { postId, content: newComment, postOwnerId },
      {
        onSuccess: () => setNewComment(''),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-120px)] py-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 animate-fade-in">
                  <Link to={`/profile/${comment.profiles.username}`}>
                    <Avatar className="w-8 h-8 transition-transform hover:scale-105">
                      <AvatarImage src={comment.profiles.avatar_url || ''} />
                      <AvatarFallback>{comment.profiles.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <Link 
                        to={`/profile/${comment.profiles.username}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {comment.profiles.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at))} ago
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </ScrollArea>

        {user ? (
          <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
            <div className="flex gap-3">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 nova-input"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newComment.trim() || addComment.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background text-center">
            <Link to="/auth" className="text-primary hover:underline">
              Sign in to comment
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
