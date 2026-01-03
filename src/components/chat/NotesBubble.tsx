import { useState } from 'react';
import { Plus, X, MessageCircle, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync(newNote.trim());
    setNewNote('');
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleDeleteNote = async () => {
    await deleteNote.mutateAsync();
    setIsCreating(false);
  };

  const openCreateSheet = () => {
    setNewNote('');
    setIsEditing(false);
    setIsCreating(true);
  };

  const openEditSheet = () => {
    if (myNote) {
      setNewNote(myNote.content);
      setIsEditing(true);
      setIsCreating(true);
    }
  };

  // Get unique notes (excluding own note for display in list)
  const otherNotes = notes?.filter(n => n.user_id !== profile?.id) || [];
  const hasNotes = otherNotes.length > 0 || myNote;

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* My Note / Create Note */}
        <button 
          onClick={myNote ? openEditSheet : openCreateSheet}
          className="flex flex-col items-center gap-1.5 min-w-fit group"
        >
          <div className="relative">
            {myNote ? (
              <>
                {/* Note content bubble */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-md rounded-full border border-primary/30 shadow-lg animate-float">
                      <p className="text-xs max-w-[70px] truncate font-medium">{myNote.content}</p>
                    </div>
                    {/* Speech bubble tail */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-primary/20 to-accent/20 rotate-45 border-r border-b border-primary/30" />
                  </div>
                </div>
                <div className="mt-4">
                  <Avatar className="w-16 h-16 ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/80">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      {profile?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </>
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:scale-105 group-hover:bg-primary/5">
                <Plus className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
            {myNote ? 'Your note' : 'Add note'}
          </span>
        </button>

        {/* Other Users' Notes */}
        {otherNotes.map((note, index) => (
          <button 
            key={note.id}
            onClick={() => setSelectedNote(note)}
            className="flex flex-col items-center gap-1.5 min-w-fit group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative">
              {/* Note content bubble */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="relative">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-accent/20 to-primary/20 backdrop-blur-md rounded-full border border-accent/30 shadow-lg animate-float" style={{ animationDelay: `${index * 200}ms` }}>
                    <p className="text-xs max-w-[70px] truncate font-medium">{note.content}</p>
                  </div>
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-accent/20 to-primary/20 rotate-45 border-r border-b border-accent/30" />
                </div>
              </div>
              <div className="mt-4">
                <Avatar className="w-16 h-16 ring-2 ring-accent/60 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-accent group-hover:scale-105">
                  <AvatarImage src={note.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                    {note.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors truncate max-w-[70px]">
              {note.profiles?.username}
            </span>
          </button>
        ))}
      </div>

      {/* Create/Edit Note Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-center pb-4">
            <SheetTitle className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isEditing ? 'Edit Your Note' : 'Share a Note'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 pb-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative">
                {newNote && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 animate-scale-in">
                    <div className="relative">
                      <div className="px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-md rounded-full border border-primary/30 shadow-lg">
                        <p className="text-sm max-w-[150px] truncate font-medium">{newNote}</p>
                      </div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-primary/20 to-accent/20 rotate-45 border-r border-b border-primary/30" />
                    </div>
                  </div>
                )}
                <Avatar className={cn(
                  "w-20 h-20 ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                  newNote ? "ring-primary mt-4" : "ring-muted"
                )}>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg">
                    {profile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* Input */}
            <div className="space-y-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={60}
                className="text-center h-12 rounded-xl text-base"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                autoFocus
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-xs text-muted-foreground">
                  Expires in 24 hours
                </p>
                <p className={cn(
                  "text-xs transition-colors",
                  newNote.length > 50 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {newNote.length}/60
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleDeleteNote}
                  disabled={deleteNote.isPending}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleCreateNote}
                disabled={!newNote.trim() || createNote.isPending}
                className="flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                {isEditing ? 'Update' : 'Share'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Note Sheet */}
      <Sheet open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {selectedNote && (
            <div className="flex flex-col items-center gap-6 py-6">
              {/* User avatar with note */}
              <div className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    <div className="px-5 py-2.5 bg-gradient-to-r from-accent/20 to-primary/20 backdrop-blur-md rounded-full border border-accent/30 shadow-lg">
                      <p className="text-base font-medium">{selectedNote.content}</p>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-accent/20 to-primary/20 rotate-45 border-r border-b border-accent/30" />
                  </div>
                </div>
                <Avatar className="w-24 h-24 mt-6 ring-2 ring-accent ring-offset-4 ring-offset-background">
                  <AvatarImage src={selectedNote.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-xl">
                    {selectedNote.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <p className="font-semibold text-lg">{selectedNote.profiles?.username}</p>
              
              <Button
                className="gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => setSelectedNote(null)}
              >
                <MessageCircle className="w-5 h-5" />
                Send Message
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NotesBubble;