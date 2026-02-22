import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Moon, 
  Sun,
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
  Loader2,
  Key,
  BellRing,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BlockedUsersSheet } from '@/components/settings/BlockedUsersSheet';
import { CloseFriendsSheet } from '@/components/settings/CloseFriendsSheet';
import { LanguageSheet, getLanguageName } from '@/components/settings/LanguageSheet';
import { NotificationSettingsSheet } from '@/components/settings/NotificationSettingsSheet';
import { SavedPostsSheet } from '@/components/settings/SavedPostsSheet';
import { LoginActivitySheet } from '@/components/settings/LoginActivitySheet';
import { ChangePasswordSheet } from '@/components/settings/ChangePasswordSheet';
import { ReportIssueSheet } from '@/components/settings/ReportIssueSheet';
import { AboutSheet } from '@/components/settings/AboutSheet';
import { VerificationSheet } from '@/components/settings/VerificationSheet';
import { useVerification } from '@/hooks/useVerification';
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
      "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-all duration-200 hover:scale-[1.01]",
      danger && "text-destructive",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn("w-8 h-8 flex items-center justify-center transition-transform duration-200", danger && "text-destructive")}>
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
  <div className="mb-6 animate-fade-in">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
      {title}
    </h3>
    <div className="bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 hover:border-primary/20">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { settings, isLoading: settingsLoading, updateSetting, isUpdating } = useUserSettings();
  const { setLanguage } = useLanguage();
  const { isSupported, permission, requestPermission, pushToken } = usePushNotifications();
  const { verification } = useVerification();
  
  // Sheet states
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [closeFriendsOpen, setCloseFriendsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savedPostsOpen, setSavedPostsOpen] = useState(false);
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleEnablePushNotifications = async () => {
    try {
      await requestPermission.mutateAsync();
      toast.success('Push notifications enabled!');
    } catch (error) {
      toast.error('Failed to enable push notifications');
    }
  };

  // Apply dark mode on mount and when settings change
  useEffect(() => {
    if (settings?.dark_mode !== undefined) {
      if (settings.dark_mode) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      localStorage.setItem('theme', settings.dark_mode ? 'dark' : 'light');
    }
  }, [settings?.dark_mode]);

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

  const isDarkMode = settings?.dark_mode ?? false;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-secondary rounded-full transition-all duration-200 hover:scale-110"
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
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border mb-6 hover:bg-secondary/50 transition-all duration-300 hover:scale-[1.01] hover:border-primary/20 animate-fade-in"
          >
            <Avatar className="w-14 h-14 transition-transform duration-200 hover:scale-110">
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
              icon={<Key className="w-5 h-5" />}
              label="Change Password"
              description="Update your password"
              onClick={() => setChangePasswordOpen(true)}
            />
            <Separator />
            <SettingItem
              icon={<Smartphone className="w-5 h-5" />}
              label="Login Activity"
              description="See where you're logged in"
              onClick={() => setLoginActivityOpen(true)}
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
            {isSupported && permission !== 'granted' && (
              <>
                <Separator />
                <SettingItem
                  icon={<BellRing className="w-5 h-5 text-primary" />}
                  label="Enable Browser Notifications"
                  description="Get real-time alerts in your browser"
                  onClick={handleEnablePushNotifications}
                  disabled={requestPermission.isPending}
                />
              </>
            )}
            {pushToken && (
              <>
                <Separator />
                <SettingItem
                  icon={<BellRing className="w-5 h-5 text-green-500" />}
                  label="Browser Notifications Active"
                  description="You'll receive real-time alerts"
                  rightElement={<span className="text-xs text-green-500">Enabled</span>}
                />
              </>
            )}
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
              onClick={() => setSavedPostsOpen(true)}
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
              icon={isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
              description={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              rightElement={
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={(checked) => handleSettingToggle('dark_mode', checked)}
                />
              }
            />
          </SettingSection>

          {/* Verification */}
          <SettingSection title="Verification">
            <SettingItem
              icon={<BadgeCheck className={verification?.is_verified ? "w-5 h-5 text-primary" : "w-5 h-5"} />}
              label="Get Nova Verified"
              description={verification?.is_verified ? "You're verified! ✨" : `${verification?.points || 0}/20 points earned`}
              onClick={() => setVerificationOpen(true)}
              rightElement={
                verification?.is_verified ? (
                  <span className="text-xs text-primary font-medium">Verified</span>
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )
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
          </SettingSection>

          {/* Help & Support */}
          <SettingSection title="Help & Support">
            <SettingItem
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Report an Issue"
              description="Tell us about problems you're facing"
              onClick={() => setReportIssueOpen(true)}
            />
            <Separator />
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
              description="App info, developer & links"
              onClick={() => setAboutOpen(true)}
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

          {/* Gama branding footer - like Instagram shows Meta */}
          <div className="flex flex-col items-center gap-3 py-8 animate-fade-in">
            <div className="relative group cursor-default">
              {/* Glow ring */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-primary/30 via-accent/20 to-primary/30 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700" />
              {/* Icon container */}
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                {/* Inner shine */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
                <span className="text-2xl font-black text-primary-foreground relative z-10 tracking-tight">G</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-wider">Gama</span>
              <span className="text-[11px] text-muted-foreground/50 tracking-widest uppercase font-medium">Version 4.11.2007</span>
            </div>
            <p className="text-[11px] text-muted-foreground/40 text-center max-w-[200px] leading-relaxed">
              Made with ♥ by Gama
            </p>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <BlockedUsersSheet open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen} />
      <CloseFriendsSheet open={closeFriendsOpen} onOpenChange={setCloseFriendsOpen} />
      <LanguageSheet 
        open={languageOpen} 
        onOpenChange={setLanguageOpen}
        currentLanguage={settings?.language ?? 'en'}
        onLanguageChange={(code) => {
          handleSettingToggle('language', code);
          setLanguage(code);
        }}
      />
      <NotificationSettingsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        settings={settings}
        onSettingChange={handleSettingToggle}
      />
      <SavedPostsSheet
        open={savedPostsOpen}
        onOpenChange={setSavedPostsOpen}
      />
      <LoginActivitySheet
        open={loginActivityOpen}
        onOpenChange={setLoginActivityOpen}
      />
      <ChangePasswordSheet
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <ReportIssueSheet
        open={reportIssueOpen}
        onOpenChange={setReportIssueOpen}
      />
      <VerificationSheet
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
      />
      <AboutSheet
        open={aboutOpen}
        onOpenChange={setAboutOpen}
      />
    </MainLayout>
  );
};

export default Settings;
