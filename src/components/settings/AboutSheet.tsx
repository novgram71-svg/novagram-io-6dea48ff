import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Github, Instagram, Globe, Heart, Shield, Code, Sparkles } from 'lucide-react';

interface AboutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutSheet = ({ open, onOpenChange }: AboutSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>About Novagram</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-6 pb-8">
            {/* App Logo & Version */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative group">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-primary/30 via-accent/20 to-primary/30 opacity-60 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
                  <span className="text-3xl font-black text-primary-foreground relative z-10">N</span>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Novagram
                </h2>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="px-1 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Novagram is a modern social media platform designed to connect people through
                photos, stories, and meaningful conversations. Built with cutting-edge technology
                and powered by Nova AI.
              </p>
            </div>

            <Separator />

            {/* Features */}
            <div className="px-1 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                Features
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Photo Sharing',
                  'Stories',
                  'Direct Messages',
                  'Nova AI Chat',
                  'Dark Mode',
                  'Multi-language',
                  'Push Notifications',
                  'Verified Badges',
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-xs font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Security */}
            <div className="px-1 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Security
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is protected with end-to-end encryption, Row-Level Security policies,
                and secure authentication. We never share your personal information with third parties.
              </p>
            </div>

            <Separator />

            {/* Developer */}
            <div className="px-1 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Developer
              </h3>
              <p className="text-sm text-muted-foreground">
                Developed by <span className="font-semibold text-foreground">Sampath</span>
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/_exotic_sampath.56"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                >
                  <Instagram className="w-4 h-4 text-pink-500" />
                  Instagram
                </a>
                <a
                  href="https://github.com/Sampath0411"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>

            <Separator />

            {/* Legal */}
            <div className="px-1 space-y-2 text-xs text-muted-foreground">
              <p>© 2024-2026 Novagram. All rights reserved.</p>
              <p>Made with ♥ by Gama</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
