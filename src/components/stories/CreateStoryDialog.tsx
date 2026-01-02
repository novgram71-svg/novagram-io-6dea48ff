import { useState, useRef } from 'react';
import { X, ImagePlus, AtSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCreateStory } from '@/hooks/useStories';
import { useStorage } from '@/hooks/useStorage';
import MentionUserDialog from './MentionUserDialog';
import { supabase } from '@/integrations/supabase/client';

interface CreateStoryDialogProps {
  children: React.ReactNode;
}

interface MentionPosition {
  userId: string;
  username: string;
  x: number;
  y: number;
}

const CreateStoryDialog = ({ children }: CreateStoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [mentions, setMentions] = useState<MentionPosition[]>([]);
  const [showMentionDialog, setShowMentionDialog] = useState(false);
  const [pendingMentionPosition, setPendingMentionPosition] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const createStory = useCreateStory();
  const { uploadStoryImage } = useStorage();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPendingMentionPosition({ x, y });
    setShowMentionDialog(true);
  };

  const handleSelectMentionUser = (user: { id: string; username: string }) => {
    if (pendingMentionPosition) {
      // Remove existing mention for same user
      setMentions(prev => prev.filter(m => m.userId !== user.id));
      
      // Add new mention
      setMentions(prev => [...prev, {
        userId: user.id,
        username: user.username,
        x: pendingMentionPosition.x,
        y: pendingMentionPosition.y
      }]);
      
      setPendingMentionPosition(null);
    }
  };

  const removeMention = (userId: string) => {
    setMentions(prev => prev.filter(m => m.userId !== userId));
  };

  const handlePost = async () => {
    if (!selectedFile || !user) return;

    setIsPosting(true);
    try {
      const imageUrl = await uploadStoryImage(selectedFile);
      await createStory.mutateAsync(imageUrl);
      
      // Get the created story to add mentions
      const { data: newStory } = await supabase
        .from('stories')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Add mentions
      if (newStory && mentions.length > 0) {
        const mentionInserts = mentions.map(m => ({
          story_id: newStory.id,
          mentioned_user_id: m.userId,
          position_x: m.x,
          position_y: m.y
        }));
        
        await supabase.from('story_mentions').insert(mentionInserts);
      }
      
      toast({
        title: "Story shared!",
        description: "Your story is now live for 24 hours.",
      });
      
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedImage(null);
    setSelectedFile(null);
    setMentions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedImage ? (
            <div 
              ref={imageContainerRef}
              className="relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-card animate-scale-in cursor-crosshair"
              onClick={handleImageClick}
            >
              <img
                src={selectedImage}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
              
              {/* Mention Tags */}
              {mentions.map((mention) => (
                <div
                  key={mention.userId}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${mention.x}%`, top: `${mention.y}%` }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMention(mention.userId);
                    }}
                    className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium hover:bg-red-500 transition-colors"
                  >
                    @{mention.username}
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                  setSelectedFile(null);
                  setMentions([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-3 right-3 p-2 bg-background/80 rounded-full text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Hint for mentions */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-black/50 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-full">
                <AtSign className="w-4 h-4" />
                Tap to tag someone
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-border hover:border-primary bg-card/50 flex flex-col items-center justify-center gap-4 transition-all duration-300 group hover:scale-[1.01]"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Add Photo</p>
                <p className="text-sm text-muted-foreground">Share a moment</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePost} 
              disabled={!selectedImage || isPosting}
            >
              {isPosting ? 'Sharing...' : 'Share Story'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <MentionUserDialog
        open={showMentionDialog}
        onOpenChange={setShowMentionDialog}
        onSelectUser={handleSelectMentionUser}
      />
    </Dialog>
  );
};

export default CreateStoryDialog;
