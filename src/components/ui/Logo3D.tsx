import { cn } from '@/lib/utils';
import logoImg from '@/assets/novagram-logo.png';

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

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <img
        src={logoImg}
        alt="Novagram"
        className={cn(sizeClasses[size], "rounded-xl object-contain")}
      />
      {showText && (
        <h1 className={cn("font-bold tracking-tight", textSizes[size])}>
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent">
            Novagram
          </span>
        </h1>
      )}
    </div>
  );
};

export default Logo3D;
