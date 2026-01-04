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
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      {/* 3D Logo Container */}
      <div className="relative perspective-1000">
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-60 blur-lg group-hover:opacity-80 transition-opacity duration-500 animate-pulse-glow",
          sizeClasses[size]
        )} />
        
        {/* Outer ring with rotation */}
        <div className={cn(
          "absolute inset-0 rounded-xl bg-gradient-conic from-primary via-accent via-50% to-primary animate-logo-spin opacity-50",
          sizeClasses[size]
        )} />
        
        {/* Main 3D cube effect */}
        <div className={cn(
          "relative rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/40 transform-3d group-hover:rotate-y-12 group-hover:rotate-x-6",
          sizeClasses[size]
        )}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 4px 20px rgba(var(--primary-rgb), 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
            0 0 40px rgba(var(--primary-rgb), 0.2)
          `,
        }}>
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent" />
          
          {/* Inner glow */}
          <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
          
          {/* Icon with 3D effect */}
          <Sparkles 
            className={cn(
              "text-primary-foreground relative z-10 drop-shadow-lg transition-all duration-300 group-hover:scale-110",
              iconSizes[size]
            )} 
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              animation: 'sparkle-rotate 3s ease-in-out infinite',
            }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/60 animate-float-particle"
                style={{
                  left: `${20 + i * 25}%`,
                  top: `${20 + i * 20}%`,
                  animationDelay: `${i * 0.5}s`,
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
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
            Novagram
          </span>
          {/* Text glow */}
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent blur-sm opacity-50 animate-pulse-soft">
            Novagram
          </span>
        </h1>
      )}
    </div>
  );
};

export default Logo3D;
