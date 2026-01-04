import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo3D = ({ size = 'md', showText = true, className }: Logo3DProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      {/* 3D Logo Container */}
      <div className="relative perspective-1000">
        {/* Soft ambient glow */}
        <div className={cn(
          "absolute inset-[-8px] rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-30 blur-2xl group-hover:opacity-50 transition-all duration-700",
          sizeClasses[size]
        )} />
        
        {/* Pulsing ring - subtle breathing effect */}
        <div className={cn(
          "absolute inset-[-4px] rounded-xl bg-gradient-to-tr from-accent via-primary to-accent opacity-40 blur-lg animate-logo-breathe",
          sizeClasses[size]
        )} />
        
        {/* Main 3D cube with smooth hover */}
        <div className={cn(
          "relative rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-2xl animate-logo-gentle-float",
          sizeClasses[size]
        )}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 8px 32px rgba(var(--primary-rgb, 139, 92, 246), 0.4),
            0 4px 16px rgba(var(--primary-rgb, 139, 92, 246), 0.2),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 0 rgba(0, 0, 0, 0.1)
          `,
        }}>
          {/* Holographic shine layer - slower, smoother */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-logo-shine" />
          </div>
          
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
          
          {/* Icon with gentle pulse */}
          <Sparkles 
            className={cn(
              "text-primary-foreground relative z-10 drop-shadow-lg transition-all duration-500 group-hover:scale-110 animate-logo-icon-pulse",
              iconSizes[size]
            )} 
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
          
          {/* Subtle floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-xl opacity-60">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/70 animate-logo-particle"
                style={{
                  left: `${25 + i * 25}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${3 + i}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Animated text */}
      {showText && (
        <h1 className={cn(
          "font-bold tracking-tight relative",
          textSizes[size]
        )}>
          <span className="bg-gradient-to-r from-primary via-accent via-60% to-primary bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent">
            Novagram
          </span>
          {/* Subtle text glow */}
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent blur-sm opacity-30 animate-pulse-soft">
            Novagram
          </span>
        </h1>
      )}
    </div>
  );
};

export default Logo3D;
