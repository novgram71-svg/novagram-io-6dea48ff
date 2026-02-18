import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle, Trash2, ChevronDown, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAIChat, Message } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface AIChatProps {
  onClose: () => void;
}

export const AIChat = ({ onClose }: AIChatProps) => {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const [input, setInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      sendMessage(input, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
      setSelectedImageFile(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col will-change-transform",
        isClosing ? "animate-slide-out-down" : "animate-slide-in-up"
      )}
      style={{ height: '100dvh' }}
    >
      {/* Gradient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-float-gentle" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] animate-float-gentle" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-border/50 bg-background/80 backdrop-blur-lg safe-area-top">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Nova AI</h1>
            <p className="text-xs text-muted-foreground">Ask me anything ✨</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearMessages}
            className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-10 w-10 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 relative z-10 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 pb-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center animate-float">
                  <Bot className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
                  <span className="text-lg">👋</span>
                </div>
              </div>
              <h2 className="font-bold text-2xl mb-3">Hey there!</h2>
              <p className="text-muted-foreground text-base max-w-sm mb-8">
                I'm Nova, your AI companion. Ask me anything — I can answer questions, analyze photos, help with tasks, and more!
              </p>
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  "What's the weather like?",
                  "Tell me a fun fact",
                  "Help me write a caption",
                  "Explain quantum physics"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                      sendMessage(suggestion);
                      setInput('');
                    }}
                    className="px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {messages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isLatest={index === messages.length - 1}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-2xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">Nova is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input - Fixed at bottom for mobile */}
      <div className="relative z-10 border-t border-border/50 bg-background/95 backdrop-blur-lg pb-safe">
        {/* Image preview above input */}
        {selectedImage && (
          <div className="px-4 pt-3 max-w-3xl mx-auto">
            <div className="relative inline-block">
              <img src={selectedImage} alt="Upload preview" className="h-20 w-20 rounded-xl object-cover border border-border/50" />
              <button
                onClick={() => { setSelectedImage(null); setSelectedImageFile(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 max-w-3xl mx-auto">
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Image upload button */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-2xl flex-shrink-0 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="h-11 sm:h-12 rounded-2xl pl-4 sm:pl-5 pr-10 sm:pr-12 bg-secondary/50 border-border/50 focus:bg-secondary/80 transition-colors text-base"
                disabled={isLoading}
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !selectedImage)} 
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isLatest }: { message: Message; isLatest: boolean }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        isLatest && 'animate-slide-up'
      )}
    >
      <Avatar className={cn(
        "w-10 h-10 flex-shrink-0 rounded-2xl transition-transform duration-200",
        isUser ? "bg-gradient-to-br from-primary to-accent" : "bg-gradient-to-br from-primary/20 to-accent/20"
      )}>
        <AvatarFallback className={cn(
          "rounded-2xl",
          isUser ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' : 'bg-transparent'
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm space-y-2',
          isUser
            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-tr-md'
            : 'bg-secondary/50 rounded-tl-md',
          message.reported && 'border border-destructive/50'
        )}
      >
        {message.reported && (
          <div className="flex items-center gap-1 text-destructive text-xs mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Content reported</span>
          </div>
        )}
        {message.imageUrl && (
          <img src={message.imageUrl} alt="Uploaded" className="rounded-xl max-w-full max-h-48 object-cover" />
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};
