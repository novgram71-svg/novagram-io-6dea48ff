import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  username?: string;
  className?: string;
  variant?: 'bubble' | 'inline' | 'minimal';
}

const TypingIndicator = ({ username, className, variant = 'bubble' }: TypingIndicatorProps) => {
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-primary animate-fade-in", className)}>
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        {username && <span className="font-medium">{username} is typing</span>}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-typing-dot"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex justify-start animate-slide-in-up", className)}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl rounded-bl-sm blur-md opacity-50" />
        
        {/* Main bubble */}
        <div className="relative bg-secondary/80 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50 shadow-lg">
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-2xl rounded-bl-sm bg-gradient-to-b from-white/5 to-transparent" />
          
          {/* Animated dots */}
          <div className="flex items-center gap-1.5 relative z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative">
                {/* Dot glow */}
                <span
                  className="absolute inset-0 bg-primary/40 rounded-full blur-sm animate-typing-dot"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
                {/* Main dot */}
                <span
                  className="relative w-2.5 h-2.5 bg-gradient-to-br from-muted-foreground to-muted-foreground/60 rounded-full block animate-typing-dot shadow-sm"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              </div>
            ))}
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-2xl rounded-bl-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        </div>
        
        {/* Tail glow */}
        <div className="absolute -bottom-1 left-0 w-3 h-3 bg-secondary/40 rounded-sm transform rotate-45 blur-sm" />
      </div>
    </div>
  );
};

export default TypingIndicator;
