import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertTriangle, Trash2, ChevronDown, ImagePlus, X, Image, Wand2 } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      sendMessage(input, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 350);
  };

  const suggestions = [
    { icon: '🌍', text: 'Tell me a fun fact' },
    { icon: '✍️', text: 'Help me write a caption' },
    { icon: '🎨', text: 'Generate an image of a sunset' },
    { icon: '🧠', text: 'Explain quantum physics simply' },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col will-change-transform",
        isClosing
          ? "animate-out slide-out-to-bottom duration-350 ease-in"
          : "animate-in slide-in-from-bottom duration-350 ease-out"
      )}
      style={{ height: '100dvh' }}
    >
      {/* Layered glass background */}
      <div className="absolute inset-0 bg-background/97 backdrop-blur-2xl" />

      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-background/60 backdrop-blur-xl safe-area-top">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Nova AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Online · Always ready
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearMessages}
            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}
            className="h-9 w-9 rounded-xl hover:bg-secondary transition-all duration-200">
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 relative z-10">
        <div className="p-4 pb-4 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[58vh] text-center px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 flex items-center justify-center border border-primary/10 shadow-xl shadow-primary/10">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md animate-bounce">
                  <span className="text-sm">👋</span>
                </div>
              </div>
              <h2 className="font-bold text-xl mb-2">Hey! I'm Nova</h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
                Your AI companion who <span className="text-primary font-medium">remembers you</span>. Ask anything, create images, or just chat!
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { sendMessage(s.text); }}
                    className="flex items-center gap-2 px-3 py-3 bg-secondary/60 hover:bg-secondary rounded-2xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-left border border-border/30 hover:border-primary/20 hover:shadow-md">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-xs leading-tight">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLatest={index === messages.length - 1}
                  index={index}
                />
              ))}
              {isLoading && (
                <div className="flex items-end gap-2.5 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 bg-secondary/60 rounded-2xl rounded-bl-md border border-border/20 shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="relative z-10 border-t border-border/40 bg-background/80 backdrop-blur-xl pb-safe">
        {selectedImage && (
          <div className="px-4 pt-3 max-w-2xl mx-auto">
            <div className="relative inline-block">
              <img src={selectedImage} alt="Upload preview" className="h-16 w-16 rounded-xl object-cover border border-border/50 shadow-md" />
              <button onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-md">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-3 max-w-2xl mx-auto">
          <div className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-2xl flex-shrink-0 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10">
              <ImagePlus className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything or say 'generate an image of...'"
                className="h-11 rounded-2xl pl-4 pr-10 bg-secondary/60 border-border/40 focus:bg-secondary/90 focus:border-primary/30 transition-all duration-200 text-sm"
                disabled={isLoading}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
              />
              {input.toLowerCase().includes('generate') && (
                <Wand2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 animate-pulse" />
              )}
            </div>
            <Button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} size="icon"
              className="h-11 w-11 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg shadow-primary/20 flex-shrink-0 disabled:opacity-40">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isLatest, index }: { message: Message; isLatest: boolean; index: number }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2.5 items-end',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'animate-in slide-in-from-bottom-3 duration-300',
      )}
      style={{ animationDelay: isLatest ? '0ms' : `${Math.min(index * 30, 200)}ms` }}
    >
      <Avatar className={cn("w-9 h-9 flex-shrink-0 rounded-2xl shadow-sm", isUser ? "mb-0" : "mb-0")}>
        <AvatarFallback className={cn(
          "rounded-2xl text-xs",
          isUser
            ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
            : 'bg-gradient-to-br from-primary/15 to-accent/15'
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        'max-w-[78%] space-y-1.5',
        isUser ? 'items-end' : 'items-start',
        'flex flex-col'
      )}>
        {message.reported && (
          <div className="flex items-center gap-1 text-destructive text-xs px-3">
            <AlertTriangle className="w-3 h-3" />
            <span>Content reported</span>
          </div>
        )}
        {message.imageUrl && (
          <img src={message.imageUrl} alt="Uploaded" className="rounded-2xl max-w-full max-h-52 object-cover shadow-md border border-border/20" />
        )}
        {message.content && (
          <div className={cn(
            'rounded-2xl px-4 py-2.5 shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-br-md'
              : 'bg-secondary/70 rounded-bl-md border border-border/20',
            message.reported && 'border border-destructive/40'
          )}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        {message.generatedImageUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg border border-primary/20 max-w-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border-b border-primary/10">
              <Image className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Generated by Nova</span>
            </div>
            <img src={message.generatedImageUrl} alt="AI Generated" className="w-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};
