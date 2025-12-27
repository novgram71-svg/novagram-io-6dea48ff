import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Smile, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { MessageWithProfile, useDeleteMessage, useEditMessage, useToggleReaction } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ReadReceipt from './ReadReceipt';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: MessageWithProfile;
  reactions?: { emoji: string; count: number; hasUserReacted: boolean }[];
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

const MessageBubble = ({ message, reactions = [] }: MessageBubbleProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  const toggleReaction = useToggleReaction();
  
  const isOwn = message.sender_id === user?.id;
  
  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage.mutateAsync({ messageId: message.id, content: editContent });
    }
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    await deleteMessage.mutateAsync(message.id);
  };
  
  const handleReaction = async (emoji: string) => {
    await toggleReaction.mutateAsync({ messageId: message.id, emoji });
    setShowEmojiPicker(false);
  };

  const isImageUrl = (url: string | null) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div
      className={cn(
        'flex group',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        "flex flex-col max-w-[70%] relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Message Actions */}
        <div className={cn(
          "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
          isOwn ? "-left-16" : "-right-16"
        )}>
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side={isOwn ? 'left' : 'right'}>
              <div className="flex gap-1 flex-wrap max-w-[200px]">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Message Content */}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl animate-fade-in',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-secondary text-secondary-foreground rounded-bl-sm'
          )}
        >
          {/* Image */}
          {message.image_url && (
            <div className="mb-2">
              <img 
                src={message.image_url} 
                alt="Shared image" 
                className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer"
                onClick={() => window.open(message.image_url!, '_blank')}
              />
            </div>
          )}
          
          {/* File */}
          {message.file_url && !isImageUrl(message.file_url) && (
            <a 
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg mb-2",
                isOwn ? "bg-primary-foreground/20" : "bg-background/50"
              )}
            >
              <FileText className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.file_name || 'File'}</p>
              </div>
              <Download className="w-4 h-4" />
            </a>
          )}
          
          {/* Text Content */}
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-w-[150px] bg-background text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <Button size="sm" onClick={handleEdit}>Save</Button>
            </div>
          ) : (
            message.content && <p className="text-sm break-words">{message.content}</p>
          )}
          
          {message.edited_at && (
            <span className="text-xs opacity-70">(edited)</span>
          )}
        </div>
        
        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={cn(
                  "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border",
                  r.hasUserReacted 
                    ? "bg-primary/20 border-primary" 
                    : "bg-secondary border-border"
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Timestamp & Read Receipt */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "flex-row" : "flex-row-reverse"
        )}>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <ReadReceipt 
              sent={true} 
              read={message.read} 
              readAt={message.read_at}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;