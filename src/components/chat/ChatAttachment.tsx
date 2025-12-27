import { useState, useRef } from 'react';
import { Paperclip, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatAttachmentProps {
  onFileSelect: (file: { url: string; name: string; type: 'image' | 'file' }) => void;
}

const ChatAttachment = ({ onFileSelect }: ChatAttachmentProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, type: 'image' | 'file') => {
    if (!user) {
      toast.error('Please sign in to share files');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      onFileSelect({ url: urlData.publicUrl, name: file.name, type });
      setOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      uploadFile(file, 'image');
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File must be less than 20MB');
        return;
      }
      uploadFile(file, 'file');
    }
    e.target.value = '';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={isUploading}
          className="text-muted-foreground hover:text-foreground"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="top" align="start">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm"
          >
            <Image className="w-4 h-4" />
            Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm"
          >
            <Paperclip className="w-4 h-4" />
            File
          </button>
        </div>
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
      </PopoverContent>
    </Popover>
  );
};

export default ChatAttachment;