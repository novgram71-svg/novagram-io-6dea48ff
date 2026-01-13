import { useMemo } from 'react';

export interface Festival {
  name: string;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
  theme: FestivalTheme;
  greeting: string;
  emoji: string;
}

export interface FestivalTheme {
  id: string;
  name: string;
  primaryGradient: string;
  accentColor: string;
  backgroundPattern?: string;
  particleType: 'diyas' | 'colors' | 'flowers' | 'stars' | 'leaves' | 'snowflakes' | 'fireworks' | 'lanterns' | 'hearts' | 'default';
  animationClass: string;
}

// Indian Festival Calendar (approximate dates, some are lunar-based)
const INDIAN_FESTIVALS: Festival[] = [
  // Makar Sankranti / Pongal (Jan 14-16)
  {
    name: 'Makar Sankranti',
    startDate: '01-13',
    endDate: '01-16',
    greeting: 'Happy Makar Sankranti! 🪁',
    emoji: '🪁',
    theme: {
      id: 'sankranti',
      name: 'Kite Festival',
      primaryGradient: 'linear-gradient(135deg, hsl(45 100% 51%), hsl(25 100% 50%))',
      accentColor: 'hsl(45 100% 51%)',
      particleType: 'default',
      animationClass: 'animate-float-kite',
    },
  },
  // Republic Day (Jan 26)
  {
    name: 'Republic Day',
    startDate: '01-25',
    endDate: '01-27',
    greeting: 'Happy Republic Day! 🇮🇳',
    emoji: '🇮🇳',
    theme: {
      id: 'republic',
      name: 'Tricolor Pride',
      primaryGradient: 'linear-gradient(135deg, hsl(30 100% 50%), hsl(120 100% 25%), hsl(30 100% 50%))',
      accentColor: 'hsl(30 100% 50%)',
      particleType: 'fireworks',
      animationClass: 'animate-patriotic-wave',
    },
  },
  // Holi (March - varies, typically mid-March)
  {
    name: 'Holi',
    startDate: '03-10',
    endDate: '03-18',
    greeting: 'Happy Holi! 🎨',
    emoji: '🎨',
    theme: {
      id: 'holi',
      name: 'Festival of Colors',
      primaryGradient: 'linear-gradient(135deg, hsl(300 100% 50%), hsl(180 100% 50%), hsl(60 100% 50%), hsl(0 100% 50%))',
      accentColor: 'hsl(300 100% 60%)',
      particleType: 'colors',
      animationClass: 'animate-color-splash',
    },
  },
  // Ugadi/Gudi Padwa (March-April)
  {
    name: 'Ugadi',
    startDate: '03-28',
    endDate: '04-02',
    greeting: 'Happy Ugadi! 🌸',
    emoji: '🌸',
    theme: {
      id: 'ugadi',
      name: 'New Beginnings',
      primaryGradient: 'linear-gradient(135deg, hsl(45 100% 60%), hsl(120 70% 50%))',
      accentColor: 'hsl(45 100% 60%)',
      particleType: 'flowers',
      animationClass: 'animate-spring-bloom',
    },
  },
  // Baisakhi (April 13-14)
  {
    name: 'Baisakhi',
    startDate: '04-12',
    endDate: '04-15',
    greeting: 'Happy Baisakhi! 🌾',
    emoji: '🌾',
    theme: {
      id: 'baisakhi',
      name: 'Harvest Festival',
      primaryGradient: 'linear-gradient(135deg, hsl(45 90% 50%), hsl(30 80% 45%))',
      accentColor: 'hsl(45 90% 50%)',
      particleType: 'leaves',
      animationClass: 'animate-harvest-dance',
    },
  },
  // Independence Day (Aug 15)
  {
    name: 'Independence Day',
    startDate: '08-14',
    endDate: '08-16',
    greeting: 'Happy Independence Day! 🇮🇳',
    emoji: '🇮🇳',
    theme: {
      id: 'independence',
      name: 'Freedom Celebration',
      primaryGradient: 'linear-gradient(135deg, hsl(30 100% 50%), hsl(0 0% 100%), hsl(120 100% 25%))',
      accentColor: 'hsl(30 100% 50%)',
      particleType: 'fireworks',
      animationClass: 'animate-patriotic-wave',
    },
  },
  // Raksha Bandhan (August - varies)
  {
    name: 'Raksha Bandhan',
    startDate: '08-18',
    endDate: '08-22',
    greeting: 'Happy Raksha Bandhan! 🎀',
    emoji: '🎀',
    theme: {
      id: 'rakhi',
      name: 'Bond of Love',
      primaryGradient: 'linear-gradient(135deg, hsl(330 100% 60%), hsl(280 100% 50%))',
      accentColor: 'hsl(330 100% 60%)',
      particleType: 'hearts',
      animationClass: 'animate-rakhi-spin',
    },
  },
  // Janmashtami (August - varies)
  {
    name: 'Janmashtami',
    startDate: '08-25',
    endDate: '08-28',
    greeting: 'Happy Janmashtami! 🦚',
    emoji: '🦚',
    theme: {
      id: 'janmashtami',
      name: 'Krishna Celebration',
      primaryGradient: 'linear-gradient(135deg, hsl(220 100% 40%), hsl(180 100% 35%))',
      accentColor: 'hsl(220 100% 50%)',
      particleType: 'stars',
      animationClass: 'animate-peacock-shimmer',
    },
  },
  // Ganesh Chaturthi (September - varies)
  {
    name: 'Ganesh Chaturthi',
    startDate: '09-05',
    endDate: '09-15',
    greeting: 'Ganpati Bappa Morya! 🐘',
    emoji: '🐘',
    theme: {
      id: 'ganesh',
      name: 'Ganesh Utsav',
      primaryGradient: 'linear-gradient(135deg, hsl(30 100% 50%), hsl(45 100% 55%))',
      accentColor: 'hsl(30 100% 50%)',
      particleType: 'flowers',
      animationClass: 'animate-ganesh-float',
    },
  },
  // Navratri (September-October - 9 days)
  {
    name: 'Navratri',
    startDate: '10-01',
    endDate: '10-12',
    greeting: 'Happy Navratri! 🔱',
    emoji: '🔱',
    theme: {
      id: 'navratri',
      name: 'Nine Nights',
      primaryGradient: 'linear-gradient(135deg, hsl(350 100% 50%), hsl(30 100% 50%), hsl(60 100% 50%))',
      accentColor: 'hsl(350 100% 50%)',
      particleType: 'flowers',
      animationClass: 'animate-dandiya-swirl',
    },
  },
  // Dussehra (October)
  {
    name: 'Dussehra',
    startDate: '10-13',
    endDate: '10-15',
    greeting: 'Happy Dussehra! 🏹',
    emoji: '🏹',
    theme: {
      id: 'dussehra',
      name: 'Victory of Good',
      primaryGradient: 'linear-gradient(135deg, hsl(30 100% 50%), hsl(0 100% 50%))',
      accentColor: 'hsl(30 100% 50%)',
      particleType: 'fireworks',
      animationClass: 'animate-victory-glow',
    },
  },
  // Diwali (October-November)
  {
    name: 'Diwali',
    startDate: '10-28',
    endDate: '11-05',
    greeting: 'Happy Diwali! ✨',
    emoji: '🪔',
    theme: {
      id: 'diwali',
      name: 'Festival of Lights',
      primaryGradient: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(30 100% 45%), hsl(350 80% 45%))',
      accentColor: 'hsl(45 100% 55%)',
      particleType: 'diyas',
      animationClass: 'animate-diya-flicker',
    },
  },
  // Chhath Puja (November)
  {
    name: 'Chhath Puja',
    startDate: '11-06',
    endDate: '11-09',
    greeting: 'Happy Chhath Puja! ☀️',
    emoji: '☀️',
    theme: {
      id: 'chhath',
      name: 'Sun Worship',
      primaryGradient: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(30 100% 50%))',
      accentColor: 'hsl(45 100% 55%)',
      particleType: 'stars',
      animationClass: 'animate-sun-rays',
    },
  },
  // Christmas (Dec 24-26)
  {
    name: 'Christmas',
    startDate: '12-24',
    endDate: '12-26',
    greeting: 'Merry Christmas! 🎄',
    emoji: '🎄',
    theme: {
      id: 'christmas',
      name: 'Winter Celebration',
      primaryGradient: 'linear-gradient(135deg, hsl(120 100% 25%), hsl(0 100% 45%))',
      accentColor: 'hsl(0 100% 45%)',
      particleType: 'snowflakes',
      animationClass: 'animate-snowfall',
    },
  },
  // New Year (Dec 31 - Jan 1)
  {
    name: 'New Year',
    startDate: '12-30',
    endDate: '01-02',
    greeting: 'Happy New Year! 🎉',
    emoji: '🎉',
    theme: {
      id: 'newyear',
      name: 'New Beginnings',
      primaryGradient: 'linear-gradient(135deg, hsl(270 100% 50%), hsl(320 100% 50%), hsl(45 100% 55%))',
      accentColor: 'hsl(270 100% 60%)',
      particleType: 'fireworks',
      animationClass: 'animate-confetti',
    },
  },
];

const DEFAULT_THEME: FestivalTheme = {
  id: 'default',
  name: 'Nova',
  primaryGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
  accentColor: 'hsl(var(--primary))',
  particleType: 'default',
  animationClass: '',
};

export const useFestivalTheme = () => {
  const currentFestival = useMemo(() => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${currentMonth}-${currentDay}`;

    // Find active festival
    for (const festival of INDIAN_FESTIVALS) {
      const start = festival.startDate;
      const end = festival.endDate;

      // Handle year-crossing festivals (e.g., New Year)
      if (start > end) {
        // Festival spans year boundary
        if (currentDateStr >= start || currentDateStr <= end) {
          return festival;
        }
      } else {
        // Normal festival within same year
        if (currentDateStr >= start && currentDateStr <= end) {
          return festival;
        }
      }
    }

    return null;
  }, []);

  const theme = currentFestival?.theme || DEFAULT_THEME;
  const isActiveFestival = currentFestival !== null;

  return {
    currentFestival,
    theme,
    isActiveFestival,
    greeting: currentFestival?.greeting || '',
    emoji: currentFestival?.emoji || '✨',
  };
};

export default useFestivalTheme;
