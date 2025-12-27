import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Moon, 
  HelpCircle, 
  Info, 
  LogOut,
  ChevronRight,
  Shield,
  Users,
  MessageCircle,
  Heart,
  Bookmark,
  Clock,
  Ban,
  Globe,
  Smartphone,
  Loader2
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BlockedUsersSheet } from '@/components/settings/BlockedUsersSheet';
import { CloseFriendsSheet } from '@/components/settings/CloseFriendsSheet';
import { LanguageSheet, getLanguageName } from '@/components/settings/LanguageSheet';
import { NotificationSettingsSheet } from '@/components/settings/NotificationSettingsSheet';
import { toast } from 'sonner';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

const SettingItem = ({ icon, label, description, onClick, rightElement, danger, disabled }: SettingItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors",
      danger && "text-destructive",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn("w-8 h-8 flex items-center justify-center", danger && "text-destructive")}>
        {icon}
      </div>
      <div className="text-left">
        <p className={cn("text-sm font-medium", danger && "text-destructive")}>{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    {rightElement !== undefined ? rightElement : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
  </button>
);

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
      {title}
    </h3>
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { settings, isLoading: settingsLoading, updateSetting, isUpdating } = useUserSettings();
  
  // Sheet states
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [closeFriendsOpen, setCloseFriendsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSettingToggle = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    await updateSetting(key, value);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || settingsLoading) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Settings</h1>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </header>

        <div className="p-4">
          {/* Profile Preview */}
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border mb-6 hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="font-semibold">{profile?.username}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Account Settings */}
          <SettingSection title="Account">
            <SettingItem
              icon={<User className="w-5 h-5" />}
              label="Edit Profile"
              description="Change your photo and name"
              onClick={() => navigate('/profile')}
            />
            <Separator />
            <SettingItem
              icon={<Lock className="w-5 h-5" />}
              label="Password and Security"
              description="Manage your password"
              onClick={() => toast.info('Password reset email will be sent')}
            />
            <Separator />
            <SettingItem
              icon={<Smartphone className="w-5 h-5" />}
              label="Devices"
              description="Manage logged in devices"
              onClick={() => toast.info('Coming soon')}
            />
          </SettingSection>

          {/* Privacy */}
          <SettingSection title="Privacy">
            <SettingItem
              icon={<Eye className="w-5 h-5" />}
              label="Private Account"
              description="Only followers can see your posts"
              rightElement={
                <Switch 
                  checked={settings?.private_account ?? false} 
                  onCheckedChange={(checked) => handleSettingToggle('private_account', checked)}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<Clock className="w-5 h-5" />}
              label="Activity Status"
              description="Show when you're online"
              rightElement={
                <Switch 
                  checked={settings?.activity_status ?? true} 
                  onCheckedChange={(checked) => handleSettingToggle('activity_status', checked)}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<MessageCircle className="w-5 h-5" />}
              label="Read Receipts"
              description="Let others know when you've read messages"
              rightElement={
                <Switch 
                  checked={settings?.read_receipts ?? true} 
                  onCheckedChange={(checked) => handleSettingToggle('read_receipts', checked)}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<Ban className="w-5 h-5" />}
              label="Blocked Accounts"
              description="Manage blocked users"
              onClick={() => setBlockedUsersOpen(true)}
            />
            <Separator />
            <SettingItem
              icon={<Users className="w-5 h-5" />}
              label="Close Friends"
              description="Manage your close friends list"
              onClick={() => setCloseFriendsOpen(true)}
            />
          </SettingSection>

          {/* Notifications */}
          <SettingSection title="Notifications">
            <SettingItem
              icon={<Bell className="w-5 h-5" />}
              label="Push Notifications"
              description="Get notified about activity"
              rightElement={
                <Switch 
                  checked={settings?.push_notifications ?? true} 
                  onCheckedChange={(checked) => handleSettingToggle('push_notifications', checked)}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<Heart className="w-5 h-5" />}
              label="Likes"
              description={settings?.like_notifications ? 'On' : 'Off'}
              onClick={() => setNotificationsOpen(true)}
            />
            <Separator />
            <SettingItem
              icon={<MessageCircle className="w-5 h-5" />}
              label="Comments"
              description={settings?.comment_notifications ? 'On' : 'Off'}
              onClick={() => setNotificationsOpen(true)}
            />
          </SettingSection>

          {/* Content & Activity */}
          <SettingSection title="Content & Activity">
            <SettingItem
              icon={<Bookmark className="w-5 h-5" />}
              label="Saved"
              description="View your saved posts"
              onClick={() => toast.info('Coming soon')}
            />
            <Separator />
            <SettingItem
              icon={<Clock className="w-5 h-5" />}
              label="Your Activity"
              description="Manage your time on the app"
              onClick={() => toast.info('Coming soon')}
            />
            <Separator />
            <SettingItem
              icon={<Globe className="w-5 h-5" />}
              label="Language"
              description={getLanguageName(settings?.language ?? 'en')}
              onClick={() => setLanguageOpen(true)}
            />
          </SettingSection>

          {/* Appearance */}
          <SettingSection title="Appearance">
            <SettingItem
              icon={<Moon className="w-5 h-5" />}
              label="Dark Mode"
              description="Toggle dark theme"
              rightElement={
                <Switch 
                  checked={settings?.dark_mode ?? false} 
                  onCheckedChange={(checked) => handleSettingToggle('dark_mode', checked)}
                />
              }
            />
          </SettingSection>

          {/* Security */}
          <SettingSection title="Security">
            <SettingItem
              icon={<Shield className="w-5 h-5" />}
              label="Two-Factor Authentication"
              description="Add extra security to your account"
              onClick={() => toast.info('Coming soon')}
            />
            <Separator />
            <SettingItem
              icon={<Lock className="w-5 h-5" />}
              label="Login Activity"
              description="See where you're logged in"
              onClick={() => toast.info('Coming soon')}
            />
          </SettingSection>

          {/* Help & Support */}
          <SettingSection title="Help & Support">
            <SettingItem
              icon={<HelpCircle className="w-5 h-5" />}
              label="Help Center"
              description="Get help with your account"
              onClick={() => toast.info('Coming soon')}
            />
            <Separator />
            <SettingItem
              icon={<Info className="w-5 h-5" />}
              label="About"
              description="Learn more about the app"
              onClick={() => toast.info('Version 1.0.0')}
            />
          </SettingSection>

          {/* Logout */}
          <SettingSection title="Login">
            <SettingItem
              icon={<LogOut className="w-5 h-5" />}
              label="Log Out"
              description="Sign out of your account"
              onClick={handleSignOut}
              danger
              rightElement={null}
            />
          </SettingSection>
        </div>
      </div>

      {/* Sheets */}
      <BlockedUsersSheet open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen} />
      <CloseFriendsSheet open={closeFriendsOpen} onOpenChange={setCloseFriendsOpen} />
      <LanguageSheet 
        open={languageOpen} 
        onOpenChange={setLanguageOpen}
        currentLanguage={settings?.language ?? 'en'}
        onLanguageChange={(code) => handleSettingToggle('language', code)}
      />
      <NotificationSettingsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        settings={settings}
        onSettingChange={handleSettingToggle}
      />
    </MainLayout>
  );
};

export default Settings;
