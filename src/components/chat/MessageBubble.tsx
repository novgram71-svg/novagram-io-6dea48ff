import { useState, useRef, useCallback } from 'react';
import { MoreVertical, Pencil, Trash2, Smile, Download, FileText, Heart, Reply, Mic } from 'lucide-react';
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
import ReadReceipt, { DeliveryStatus } from './ReadReceipt';
import SharedPostCard from './SharedPostCard';
import VoiceMessage from './VoiceMessage';
import { cn } from '@/lib/utils';
import { ChatTheme } from '@/hooks/useChatThemes';

interface MessageBubbleProps {
  message: MessageWithProfile;
  reactions?: { emoji: string; count: number; hasUserReacted: boolean }[];
  theme?: ChatTheme;
  onReply?: (message: MessageWithProfile) => void;
  replyToMessage?: MessageWithProfile | null;
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

const MessageBubble = ({ message, reactions = [], theme, onReply, replyToMessage }: MessageBubbleProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  
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

  // Double-tap to like (Instagram style)
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - add heart reaction
      setShowHeartAnimation(true);
      toggleReaction.mutate({ messageId: message.id, emoji: '❤️' });
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  }, [message.id, toggleReaction]);

  const isImageUrl = (url: string | null) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Get bubble styles based on theme
  const getBubbleClasses = () => {
    if (theme) {
      return isOwn
        ? cn(theme.sentBubbleGradient, theme.sentTextColor)
        : cn(theme.receivedBubbleColor, theme.receivedTextColor);
    }
    return isOwn
      ? 'bg-primary text-primary-foreground'
      : 'bg-secondary text-secondary-foreground';
  };

  // Check if this message has a shared post
  const sharedPostId = (message as any).shared_post_id;
  const voiceUrl = (message as any).voice_url;

  const getReplyPreviewContent = (msg: MessageWithProfile) => {
    if ((msg as any).voice_url) {
      return (
        <span className="flex items-center gap-1">
          <Mic className="w-3 h-3" />
          Voice message
        </span>
      );
    }
    if (msg.image_url) return '📷 Photo';
    if (msg.file_url) return `📎 ${msg.file_name || 'File'}`;
    return msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
  };

  return (
    <div
      className={cn(
        'flex group',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div 
        className={cn(
          "flex flex-col max-w-[70%] relative",
          isOwn ? "items-end" : "items-start"
        )}
        onClick={handleDoubleTap}
      >
        {/* Heart animation on double-tap */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-16 h-16 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}
        {/* Message Actions */}
        <div className={cn(
          "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
          isOwn ? "-left-20" : "-right-20"
        )}>
          {/* Reply button */}
          {onReply && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
            >
              <Reply className="w-4 h-4" />
            </Button>
          )}
          
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
                {!voiceUrl && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Reply Quote */}
        {replyToMessage && (
          <div 
            className={cn(
              "px-3 py-2 rounded-t-xl text-xs border-l-2 border-primary mb-0.5",
              isOwn ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <p className="font-medium text-primary text-[10px]">
              {replyToMessage.sender_id === user?.id ? 'You' : replyToMessage.sender.username}
            </p>
            <p className="text-muted-foreground truncate">
              {getReplyPreviewContent(replyToMessage)}
            </p>
          </div>
        )}
        
        {/* Shared Post Card */}
        {sharedPostId && (
          <div className="mb-2">
            <SharedPostCard postId={sharedPostId} isOwn={isOwn} />
          </div>
        )}

        {/* Message Content */}
        {(message.content || message.image_url || message.file_url || voiceUrl) && (
          <div
            className={cn(
              'px-4 py-2 rounded-2xl animate-fade-in',
              getBubbleClasses(),
              isOwn ? 'rounded-br-sm' : 'rounded-bl-sm',
              replyToMessage && 'rounded-t-none'
            )}
          >
            {/* Voice Message */}
            {voiceUrl && (
              <VoiceMessage url={voiceUrl} isOwn={isOwn} />
            )}
            
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
            {!voiceUrl && (
              isEditing ? (
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
              )
            )}
            
            {message.edited_at && (
              <span className="text-xs opacity-70">(edited)</span>
            )}
          </div>
        )}
        
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
              status={message.read ? 'read' : 'delivered' as DeliveryStatus}
              readAt={message.read_at}
              sentAt={message.created_at}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;