import { useEffect, useState, memo } from 'react';
import { useFestivalTheme } from '@/hooks/useFestivalTheme';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  emoji?: string;
}

const PARTICLE_EMOJIS: Record<string, string[]> = {
  diyas: ['🪔', '✨', '🌟', '💫'],
  colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '💜', '💚', '💛'],
  flowers: ['🌸', '🌺', '🌼', '🌻', '💐', '🌷'],
  stars: ['⭐', '🌟', '✨', '💫', '🌙'],
  leaves: ['🍂', '🍁', '🌾', '🌿'],
  snowflakes: ['❄️', '🌨️', '⛄', '❅'],
  fireworks: ['🎆', '🎇', '✨', '💥', '🌟'],
  lanterns: ['🏮', '🎐', '✨', '🌟'],
  hearts: ['❤️', '💕', '💖', '💗', '💝'],
  default: ['✨', '💫', '🌟'],
};

const FestivalParticles = memo(() => {
  const { theme, isActiveFestival } = useFestivalTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActiveFestival) {
      setParticles([]);
      return;
    }

    const emojis = PARTICLE_EMOJIS[theme.particleType] || PARTICLE_EMOJIS.default;
    const particleCount = 15;

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 16,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    setParticles(newParticles);
  }, [isActiveFestival, theme.particleType]);

  if (!isActiveFestival || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            'absolute animate-festival-float opacity-60',
            theme.animationClass
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
});

FestivalParticles.displayName = 'FestivalParticles';

export default FestivalParticles;
