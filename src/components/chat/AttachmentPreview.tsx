import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  file: { url: string; name: string; type: 'image' | 'file' };
  onRemove: () => void;
}

const AttachmentPreview = ({ file, onRemove }: AttachmentPreviewProps) => {
  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-secondary rounded-lg mr-2 mb-2 animate-fade-in">
      {file.type === 'image' ? (
        <img 
          src={file.url} 
          alt={file.name} 
          className="w-16 h-16 object-cover rounded"
        />
      ) : (
        <div className="w-16 h-16 flex items-center justify-center bg-background rounded">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="max-w-[100px]">
        <p className="text-xs truncate">{file.name}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default AttachmentPreview;