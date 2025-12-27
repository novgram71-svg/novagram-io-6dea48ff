import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, UserPlus, Send } from 'lucide-react';
import { UserSettings } from '@/hooks/useUserSettings';

interface NotificationSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings | null | undefined;
  onSettingChange: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

interface NotificationItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const NotificationItem = ({ icon, label, description, checked, onCheckedChange }: NotificationItemProps) => (
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export const NotificationSettingsSheet = ({ 
  open, 
  onOpenChange, 
  settings,
  onSettingChange
}: NotificationSettingsSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notification Settings</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 bg-card rounded-xl overflow-hidden border border-border">
          <NotificationItem
            icon={<Heart className="w-5 h-5" />}
            label="Likes"
            description="When someone likes your post"
            checked={settings?.like_notifications ?? true}
            onCheckedChange={(checked) => onSettingChange('like_notifications', checked)}
          />
          <Separator />
          <NotificationItem
            icon={<MessageCircle className="w-5 h-5" />}
            label="Comments"
            description="When someone comments on your post"
            checked={settings?.comment_notifications ?? true}
            onCheckedChange={(checked) => onSettingChange('comment_notifications', checked)}
          />
          <Separator />
          <NotificationItem
            icon={<UserPlus className="w-5 h-5" />}
            label="New Followers"
            description="When someone follows you"
            checked={settings?.follow_notifications ?? true}
            onCheckedChange={(checked) => onSettingChange('follow_notifications', checked)}
          />
          <Separator />
          <NotificationItem
            icon={<Send className="w-5 h-5" />}
            label="Messages"
            description="When you receive a new message"
            checked={settings?.message_notifications ?? true}
            onCheckedChange={(checked) => onSettingChange('message_notifications', checked)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
