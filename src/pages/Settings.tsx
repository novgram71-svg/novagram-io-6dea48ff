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
  Smartphone
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem = ({ icon, label, description, onClick, rightElement, danger }: SettingItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors",
      danger && "text-destructive"
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
    {rightElement || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
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
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const handleDarkModeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
            />
            <Separator />
            <SettingItem
              icon={<Smartphone className="w-5 h-5" />}
              label="Devices"
              description="Manage logged in devices"
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
                  checked={privateAccount} 
                  onCheckedChange={setPrivateAccount}
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
                  checked={activityStatus} 
                  onCheckedChange={setActivityStatus}
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
                  checked={readReceipts} 
                  onCheckedChange={setReadReceipts}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<Ban className="w-5 h-5" />}
              label="Blocked Accounts"
              description="Manage blocked users"
            />
            <Separator />
            <SettingItem
              icon={<Users className="w-5 h-5" />}
              label="Close Friends"
              description="Manage your close friends list"
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
                  checked={notificationsEnabled} 
                  onCheckedChange={setNotificationsEnabled}
                />
              }
            />
            <Separator />
            <SettingItem
              icon={<Heart className="w-5 h-5" />}
              label="Likes"
              description="Get notified when someone likes your post"
            />
            <Separator />
            <SettingItem
              icon={<MessageCircle className="w-5 h-5" />}
              label="Comments"
              description="Get notified about new comments"
            />
          </SettingSection>

          {/* Content & Activity */}
          <SettingSection title="Content & Activity">
            <SettingItem
              icon={<Bookmark className="w-5 h-5" />}
              label="Saved"
              description="View your saved posts"
            />
            <Separator />
            <SettingItem
              icon={<Clock className="w-5 h-5" />}
              label="Your Activity"
              description="Manage your time on the app"
            />
            <Separator />
            <SettingItem
              icon={<Globe className="w-5 h-5" />}
              label="Language"
              description="English"
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
                  checked={darkMode} 
                  onCheckedChange={handleDarkModeToggle}
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
            />
            <Separator />
            <SettingItem
              icon={<Lock className="w-5 h-5" />}
              label="Login Activity"
              description="See where you're logged in"
            />
          </SettingSection>

          {/* Help & Support */}
          <SettingSection title="Help & Support">
            <SettingItem
              icon={<HelpCircle className="w-5 h-5" />}
              label="Help Center"
              description="Get help with your account"
            />
            <Separator />
            <SettingItem
              icon={<Info className="w-5 h-5" />}
              label="About"
              description="Learn more about the app"
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
    </MainLayout>
  );
};

export default Settings;
