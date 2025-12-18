import { useState, useRef } from 'react';
import { ImagePlus, X, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/usePosts';
import { useStorage } from '@/hooks/useStorage';

const Create = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createPost = useCreatePost();
  const { uploadPostImage } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

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

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (url) {
      setSelectedImage(url);
      setSelectedFile(null);
    } else {
      setSelectedImage(null);
    }
  };

  const handlePost = async () => {
    if (!selectedImage || !user) return;

    setIsPosting(true);
    try {
      let finalImageUrl = imageUrl;

      if (selectedFile) {
        finalImageUrl = await uploadPostImage(selectedFile);
      }

      await createPost.mutateAsync({ imageUrl: finalImageUrl, caption });
      
      toast({
        title: "Post shared!",
        description: "Your post has been shared successfully.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setImageUrl('');
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
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
          {/* Upload Mode Tabs */}
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'file' | 'url')}>
            <TabsList className="w-full">
              <TabsTrigger value="file" className="flex-1 gap-2">
                <ImagePlus className="w-4 h-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-2">
                <LinkIcon className="w-4 h-4" />
                Image URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              {selectedImage && uploadMode === 'file' ? (
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
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary bg-card/50 flex flex-col items-center justify-center gap-4 transition-all duration-300 group hover:scale-[1.02]"
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
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste image URL..."
                  className="nova-input"
                />
              </div>
              {selectedImage && uploadMode === 'url' && (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-card animate-scale-in">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => {
                      toast({
                        title: "Invalid URL",
                        description: "Could not load image from this URL",
                        variant: "destructive",
                      });
                      handleClear();
                    }}
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-2 bg-background/80 rounded-full text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>

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
