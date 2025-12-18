import { useState, useRef } from 'react';
import { ImagePlus, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Create = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!selectedImage) return;

    setIsPosting(true);
    
    // Simulate posting
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Post shared!",
      description: "Your post has been shared successfully.",
    });
    
    setIsPosting(false);
    navigate('/');
  };

  const handleClear = () => {
    setSelectedImage(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Create Post</h1>
            <Button
              onClick={handlePost}
              disabled={!selectedImage || isPosting}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {isPosting ? 'Posting...' : 'Share'}
            </Button>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Image Upload */}
          {selectedImage ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-card animate-scale-in">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 bg-background/80 rounded-full text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary bg-card/50 flex flex-col items-center justify-center gap-4 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Add Photo</p>
                <p className="text-sm text-muted-foreground">Tap to select from your device</p>
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

          {/* Caption */}
          {selectedImage && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium">Caption</label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="min-h-32 nova-input resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {caption.length}/2,200
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Create;
