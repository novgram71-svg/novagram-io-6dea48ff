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
        {/* Multi-layer glow effect */}
        <div className={cn(
          "absolute inset-[-8px] rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-40 blur-2xl group-hover:opacity-70 transition-all duration-700 animate-pulse-glow",
          sizeClasses[size]
        )} />
        <div className={cn(
          "absolute inset-[-4px] rounded-xl bg-gradient-to-tr from-accent via-primary to-accent opacity-50 blur-lg animate-logo-pulse",
          sizeClasses[size]
        )} />
        
        {/* Orbiting ring */}
        <div className={cn(
          "absolute inset-[-6px] rounded-full border-2 border-primary/30 animate-orbit opacity-60",
          sizeClasses[size]
        )} 
        style={{ 
          width: 'calc(100% + 12px)', 
          height: 'calc(100% + 12px)',
        }}
        />
        
        {/* Second orbiting ring */}
        <div className={cn(
          "absolute inset-[-10px] rounded-full border border-accent/20 animate-orbit-reverse opacity-40",
          sizeClasses[size]
        )} 
        style={{ 
          width: 'calc(100% + 20px)', 
          height: 'calc(100% + 20px)',
        }}
        />
        
        {/* Main 3D cube with enhanced effects */}
        <div className={cn(
          "relative rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-2xl transform-3d group-hover:rotate-y-12 group-hover:rotate-x-6 animate-logo-float",
          sizeClasses[size]
        )}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 8px 32px rgba(var(--primary-rgb, 139, 92, 246), 0.5),
            0 4px 16px rgba(var(--primary-rgb, 139, 92, 246), 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.25),
            inset 0 -2px 0 rgba(0, 0, 0, 0.15),
            0 0 60px rgba(var(--primary-rgb, 139, 92, 246), 0.25)
          `,
        }}>
          {/* Holographic shine layer */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-holographic-shine" />
          </div>
          
          {/* Glass overlay with depth */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 via-white/5 to-transparent" />
          
          {/* Prismatic edge effect */}
          <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/10 via-transparent to-black/10" />
          
          {/* Icon with enhanced animation */}
          <Sparkles 
            className={cn(
              "text-primary-foreground relative z-10 drop-shadow-xl transition-all duration-500 group-hover:scale-125 animate-sparkle-3d",
              iconSizes[size]
            )} 
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
            }}
          />
          
          {/* Floating energy particles */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/80 animate-particle-orbit"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${15 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + (i % 2)}s`,
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                }}
              />
            ))}
          </div>
          
          {/* Core energy pulse */}
          <div className="absolute inset-0 rounded-xl bg-gradient-radial from-white/20 via-transparent to-transparent animate-core-pulse" />
        </div>
      </div>

      {/* Enhanced animated text */}
      {showText && (
        <h1 className={cn(
          "font-bold tracking-tight relative",
          textSizes[size]
        )}>
          <span className="bg-gradient-to-r from-primary via-accent via-60% to-primary bg-[length:300%_auto] animate-text-shimmer bg-clip-text text-transparent">
            Novagram
          </span>
          {/* Multi-layer text glow */}
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent blur-md opacity-40 animate-pulse-soft">
            Novagram
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent blur-sm opacity-30 animate-glow-pulse">
            Novagram
          </span>
        </h1>
      )}
    </div>
  );
};

export default Logo3D;
