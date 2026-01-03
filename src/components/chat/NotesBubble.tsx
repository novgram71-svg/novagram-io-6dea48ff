import { useState } from 'react';
import { Plus, X, MessageCircle, Edit2, Trash2, Sparkles, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMessageNotes, useMyNote, useCreateNote, useDeleteNote, useNoteReactions, useReactToNote, useMyNoteReaction } from '@/hooks/useMessageNotes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

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
  const [showReactions, setShowReactions] = useState<string | null>(null);

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
                  {/* Show reaction count on my note */}
                  <MyNoteReactions noteId={myNote.id} />
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
          <NoteItem 
            key={note.id} 
            note={note} 
            index={index}
            onSelect={() => setSelectedNote(note)}
            showReactions={showReactions === note.id}
            onToggleReactions={() => setShowReactions(showReactions === note.id ? null : note.id)}
          />
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

      {/* View Note Sheet with Reactions */}
      <Sheet open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {selectedNote && (
            <NoteViewSheet note={selectedNote} onClose={() => setSelectedNote(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

// Component for displaying my note's reactions
const MyNoteReactions = ({ noteId }: { noteId: string }) => {
  const { data: reactions } = useNoteReactions(noteId);
  
  if (!reactions?.length) return null;
  
  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topEmojis = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return (
    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-border shadow-sm">
      {topEmojis.map(([emoji, count]) => (
        <span key={emoji} className="text-xs">{emoji}</span>
      ))}
      <span className="text-[10px] text-muted-foreground ml-0.5">{reactions.length}</span>
    </div>
  );
};

// Individual note item with reactions
interface NoteItemProps {
  note: any;
  index: number;
  onSelect: () => void;
  showReactions: boolean;
  onToggleReactions: () => void;
}

const NoteItem = ({ note, index, onSelect, showReactions, onToggleReactions }: NoteItemProps) => {
  const { data: reactions } = useNoteReactions(note.id);
  const { data: myReaction } = useMyNoteReaction(note.id);
  const reactToNote = useReactToNote();
  
  const handleReact = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    reactToNote.mutate({ noteId: note.id, emoji });
    onToggleReactions();
  };
  
  const handleLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onToggleReactions();
  };
  
  // Group reactions by emoji
  const reactionCounts = reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  const topEmojis = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="relative flex flex-col items-center gap-1.5 min-w-fit">
      {/* Reaction picker popup */}
      {showReactions && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 animate-scale-in">
          <div className="flex gap-1 bg-background/95 backdrop-blur-lg rounded-full px-2 py-1.5 border border-border shadow-xl">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => handleReact(emoji, e)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-125 active:scale-95",
                  myReaction?.emoji === emoji && "bg-primary/20 ring-2 ring-primary"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-background/95 rotate-45 border-r border-b border-border" />
        </div>
      )}
      
      <button 
        onClick={onSelect}
        onContextMenu={handleLongPress}
        onDoubleClick={onToggleReactions}
        className="flex flex-col items-center gap-1.5 group animate-fade-in"
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
          <div className="mt-4 relative">
            <Avatar className={cn(
              "w-16 h-16 ring-2 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:scale-105",
              myReaction ? "ring-primary" : "ring-accent/60 group-hover:ring-accent"
            )}>
              <AvatarImage src={note.profiles?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                {note.profiles?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Reaction indicator */}
            {topEmojis.length > 0 && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-border shadow-sm">
                {topEmojis.map(([emoji]) => (
                  <span key={emoji} className="text-xs">{emoji}</span>
                ))}
                {reactions && reactions.length > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-0.5">{reactions.length}</span>
                )}
              </div>
            )}
            
            {/* My reaction badge */}
            {myReaction && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border shadow-sm animate-pop-in">
                <span className="text-xs">{myReaction.emoji}</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors truncate max-w-[70px]">
          {note.profiles?.username}
        </span>
      </button>
      
      {/* Quick react button */}
      <button
        onClick={onToggleReactions}
        className="absolute top-8 -right-1 w-6 h-6 bg-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-secondary border border-border/50"
      >
        <Heart className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
};

// Note view sheet with reaction functionality
const NoteViewSheet = ({ note, onClose }: { note: any; onClose: () => void }) => {
  const { data: reactions } = useNoteReactions(note.id);
  const { data: myReaction } = useMyNoteReaction(note.id);
  const reactToNote = useReactToNote();
  
  const handleReact = (emoji: string) => {
    reactToNote.mutate({ noteId: note.id, emoji });
  };
  
  // Group reactions by emoji
  const reactionCounts = reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* User avatar with note */}
      <div className="relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="px-5 py-2.5 bg-gradient-to-r from-accent/20 to-primary/20 backdrop-blur-md rounded-full border border-accent/30 shadow-lg">
              <p className="text-base font-medium">{note.content}</p>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-accent/20 to-primary/20 rotate-45 border-r border-b border-accent/30" />
          </div>
        </div>
        <Avatar className="w-24 h-24 mt-6 ring-2 ring-accent ring-offset-4 ring-offset-background">
          <AvatarImage src={note.profiles?.avatar_url || ''} />
          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-xl">
            {note.profiles?.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <p className="font-semibold text-lg">{note.profiles?.username}</p>
      
      {/* Emoji reactions */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-muted-foreground text-center mb-3">React to this note</p>
        <div className="flex justify-center gap-2">
          {REACTION_EMOJIS.map((emoji) => {
            const count = reactionCounts[emoji] || 0;
            const isMyReaction = myReaction?.emoji === emoji;
            
            return (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95",
                  isMyReaction 
                    ? "bg-primary/20 ring-2 ring-primary" 
                    : "hover:bg-secondary"
                )}
              >
                <span className="text-2xl">{emoji}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-xs font-medium",
                    isMyReaction ? "text-primary" : "text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Show all reactions */}
      {reactions && reactions.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {reactions.length} {reactions.length === 1 ? 'reaction' : 'reactions'}
          </p>
        </div>
      )}
      
      <Button
        className="gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
        onClick={onClose}
      >
        <MessageCircle className="w-5 h-5" />
        Send Message
      </Button>
    </div>
  );
};

export default NotesBubble;