import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

interface LanguageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const LanguageSheet = ({ 
  open, 
  onOpenChange, 
  currentLanguage, 
  onLanguageChange 
}: LanguageSheetProps) => {
  const handleSelect = (code: string) => {
    onLanguageChange(code);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Language</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg transition-colors",
                currentLanguage === lang.code 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-secondary/50"
              )}
            >
              <span className="font-medium">{lang.name}</span>
              {currentLanguage === lang.code && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const getLanguageName = (code: string) => {
  return languages.find(l => l.code === code)?.name || 'English';
};
