import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CHAT_THEMES, useSetChatTheme, ChatTheme } from '@/hooks/useChatThemes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatThemeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  currentThemeId: string;
}

const ChatThemeSheet = ({ open, onOpenChange, partnerId, currentThemeId }: ChatThemeSheetProps) => {
  const setChatTheme = useSetChatTheme();

  const handleSelectTheme = async (theme: ChatTheme) => {
    try {
      await setChatTheme.mutateAsync({ partnerId, themeId: theme.id });
      toast.success(`Theme changed to ${theme.name}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to change theme');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>Chat Theme</SheetTitle>
        </SheetHeader>

        <div className="py-6 grid grid-cols-2 gap-4">
          {CHAT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelectTheme(theme)}
              className={cn(
                'relative rounded-2xl p-4 h-32 flex flex-col items-center justify-center gap-2 border-2 transition-all',
                currentThemeId === theme.id 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50',
                theme.backgroundGradient
              )}
            >
              {/* Preview bubbles */}
              <div className="flex flex-col gap-2 w-full">
                <div className={cn(
                  'self-end px-3 py-1.5 rounded-2xl rounded-br-sm text-xs',
                  theme.sentBubbleGradient,
                  theme.sentTextColor
                )}>
                  Hello!
                </div>
                <div className={cn(
                  'self-start px-3 py-1.5 rounded-2xl rounded-bl-sm text-xs',
                  theme.receivedBubbleColor,
                  theme.receivedTextColor
                )}>
                  Hi there!
                </div>
              </div>

              <span className="text-sm font-medium mt-2">{theme.name}</span>

              {currentThemeId === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatThemeSheet;
