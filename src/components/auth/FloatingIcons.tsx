import { Camera, Heart, MessageCircle, Users, Sparkles, Star, Zap, Music, Image, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  { Icon: Camera, delay: '0s', duration: '15s', left: '5%', size: 'w-8 h-8' },
  { Icon: Heart, delay: '2s', duration: '18s', left: '15%', size: 'w-6 h-6' },
  { Icon: MessageCircle, delay: '1s', duration: '20s', left: '25%', size: 'w-9 h-9' },
  { Icon: Users, delay: '3s', duration: '16s', left: '35%', size: 'w-7 h-7' },
  { Icon: Sparkles, delay: '0.5s', duration: '17s', left: '45%', size: 'w-8 h-8' },
  { Icon: Star, delay: '2.5s', duration: '19s', left: '55%', size: 'w-6 h-6' },
  { Icon: Zap, delay: '1.5s', duration: '14s', left: '65%', size: 'w-8 h-8' },
  { Icon: Music, delay: '3.5s', duration: '21s', left: '75%', size: 'w-7 h-7' },
  { Icon: Image, delay: '0.8s', duration: '16s', left: '85%', size: 'w-8 h-8' },
  { Icon: Film, delay: '2.2s', duration: '18s', left: '92%', size: 'w-6 h-6' },
];

export const FloatingIcons = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {icons.map(({ Icon, delay, duration, left, size }, index) => (
        <div
          key={index}
          className={cn(
            'absolute animate-float-icon text-primary/30',
            size
          )}
          style={{
            left,
            bottom: '-60px',
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          <Icon className="w-full h-full drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      ))}
      
      {/* Second layer with different timing */}
      {icons.slice(0, 5).map(({ Icon, left, size }, index) => (
        <div
          key={`second-${index}`}
          className={cn(
            'absolute animate-float-icon-reverse text-accent/20',
            size
          )}
          style={{
            left: `${parseInt(left) + 10}%`,
            top: '-60px',
            animationDelay: `${index * 1.5}s`,
            animationDuration: `${22 + index * 2}s`,
          }}
        >
          <Icon className="w-full h-full drop-shadow-[0_0_6px_hsl(var(--accent)/0.4)]" />
        </div>
      ))}
    </div>
  );
};

export default FloatingIcons;
