import { useState, useRef } from 'react';
import { Plus, X, ImagePlus } from 'lucide-react';
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

interface CreateStoryDialogProps {
  children: React.ReactNode;
}

const CreateStoryDialog = ({ children }: CreateStoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handlePost = async () => {
    if (!selectedFile || !user) return;

    setIsPosting(true);
    try {
      const imageUrl = await uploadStoryImage(selectedFile);
      await createStory.mutateAsync(imageUrl);
      
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
            <div className="relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-card animate-scale-in">
              <img
                src={selectedImage}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-3 right-3 p-2 bg-background/80 rounded-full text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
    </Dialog>
  );
};

export default CreateStoryDialog;
