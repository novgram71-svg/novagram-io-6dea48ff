import { useState, useEffect } from 'react';
import { useFestivalTheme } from '@/hooks/useFestivalTheme';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FestivalBanner = () => {
  const { currentFestival, isActiveFestival, greeting, emoji, theme } = useFestivalTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isActiveFestival || !currentFestival) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed this festival's banner today
    const dismissedKey = `festival_banner_dismissed_${currentFestival.name}`;
    const dismissedDate = localStorage.getItem(dismissedKey);
    const today = new Date().toDateString();

    if (dismissedDate === today) {
      setIsDismissed(true);
      return;
    }

    // Show banner after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [isActiveFestival, currentFestival]);

  const handleDismiss = () => {
    if (currentFestival) {
      const dismissedKey = `festival_banner_dismissed_${currentFestival.name}`;
      localStorage.setItem(dismissedKey, new Date().toDateString());
    }
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isActiveFestival || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transform transition-all duration-500',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <div
        className="relative px-4 py-3 text-center text-white overflow-hidden"
        style={{
          background: theme.primaryGradient,
        }}
      >
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Sparkle decorations */}
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 animate-pulse" />
        <Sparkles className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 animate-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Content */}
        <div className="relative flex items-center justify-center gap-2">
          <span className="text-xl animate-bounce" style={{ animationDuration: '2s' }}>
            {emoji}
          </span>
          <span className="font-semibold text-sm sm:text-base">
            {greeting}
          </span>
          <span className="text-xl animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
            {emoji}
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss festival banner"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FestivalBanner;
