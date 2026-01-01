import { useState } from 'react';
import { Plus, X, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMessageNotes, useMyNote, useCreateNote, useDeleteNote } from '@/hooks/useMessageNotes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NotesBubble = () => {
  const { profile } = useAuth();
  const { data: notes } = useMessageNotes();
  const { data: myNote } = useMyNote();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<typeof notes[0] | null>(null);

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync(newNote.trim());
    setNewNote('');
    setIsCreating(false);
  };

  const handleDeleteNote = async () => {
    await deleteNote.mutateAsync();
  };

  // Get unique notes (excluding own note for display in list)
  const otherNotes = notes?.filter(n => n.user_id !== profile?.id) || [];
  const hasNotes = otherNotes.length > 0 || myNote;

  if (!hasNotes && !isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="flex flex-col items-center gap-1 px-4 py-2 group animate-fade-in"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:scale-105">
            <Plus className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          Share note
        </span>
      </button>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-2 overflow-x-auto scrollbar-hide animate-slide-up">
      {/* My Note / Create Note */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <button className="flex flex-col items-center gap-1 min-w-fit group">
            <div className="relative">
              {myNote ? (
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary px-2 py-0.5 rounded-full border border-border z-10 animate-bounce-gentle">
                    <p className="text-xs max-w-[60px] truncate">{myNote.content}</p>
                  </div>
                  <Avatar className="w-16 h-16 ring-2 ring-primary transition-all duration-300 group-hover:scale-105">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:scale-105">
                  <Plus className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {myNote ? 'Your note' : 'Share note'}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>{myNote ? 'Your Note' : 'Share a Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {myNote ? (
              <>
                <div className="p-4 bg-secondary rounded-xl">
                  <p className="text-center text-lg">{myNote.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDeleteNote}
                    disabled={deleteNote.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete Note
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setNewNote(myNote.content);
                    }}
                  >
                    Edit Note
                  </Button>
                </div>
              </>
            ) : null}
            
            <div className="space-y-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Share what's on your mind..."
                maxLength={60}
                className="text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
              />
              <p className="text-xs text-muted-foreground text-center">
                {newNote.length}/60 characters • Expires in 24 hours
              </p>
            </div>
            
            <Button
              onClick={handleCreateNote}
              disabled={!newNote.trim() || createNote.isPending}
              className="w-full transition-all duration-200 hover:scale-[1.02]"
            >
              {myNote ? 'Update Note' : 'Share Note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Other Users' Notes */}
      {otherNotes.map((note) => (
        <Dialog key={note.id} open={selectedNote?.id === note.id} onOpenChange={(open) => setSelectedNote(open ? note : null)}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 min-w-fit group animate-fade-in">
              <div className="relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-primary/30 z-10 animate-float">
                  <p className="text-xs max-w-[60px] truncate font-medium">{note.content}</p>
                </div>
                <Avatar className="w-16 h-16 ring-2 ring-primary/60 transition-all duration-300 group-hover:ring-primary group-hover:scale-105">
                  <AvatarImage src={note.profiles?.avatar_url || ''} />
                  <AvatarFallback>{note.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {note.profiles?.username}
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md animate-scale-in">
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="w-20 h-20 ring-2 ring-primary">
                <AvatarImage src={note.profiles?.avatar_url || ''} />
                <AvatarFallback>{note.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{note.profiles?.username}</p>
              <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl w-full">
                <p className="text-center text-xl font-medium">{note.content}</p>
              </div>
              <Button
                variant="outline"
                className="gap-2 transition-all duration-200 hover:scale-105"
                onClick={() => setSelectedNote(null)}
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

export default NotesBubble;
