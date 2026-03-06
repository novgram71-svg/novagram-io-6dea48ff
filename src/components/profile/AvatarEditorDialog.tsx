import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGenerateAvatar, useUserAvatar, AvatarConfig } from '@/hooks/useAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, User, Shirt, Scissors, Palette, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HAIR_STYLES = ['short', 'long', 'curly', 'wavy', 'buzz cut', 'ponytail', 'braids', 'afro'];
const HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'blue', 'pink'];
const SKIN_TONES = ['light', 'fair', 'medium', 'olive', 'tan', 'brown', 'dark', 'deep'];
const OUTFITS = ['casual', 'formal suit', 'sporty', 'hoodie', 'traditional', 'streetwear', 'elegant dress', 'denim jacket'];
const ACCESSORIES_LIST = ['none', 'glasses', 'sunglasses', 'earrings', 'necklace', 'hat', 'headband', 'scarf'];

type Step = 'gender' | 'customize';

const AvatarEditorDialog = ({ open, onOpenChange }: AvatarEditorDialogProps) => {
  const { user } = useAuth();
  const { data: existingAvatar } = useUserAvatar(user?.id);
  const generateAvatar = useGenerateAvatar();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(existingAvatar ? 'customize' : 'gender');
  const [config, setConfig] = useState<AvatarConfig>({
    gender: existingAvatar?.gender || 'male',
    hair_style: existingAvatar?.hair_style || 'short',
    hair_color: existingAvatar?.hair_color || 'black',
    skin_tone: existingAvatar?.skin_tone || 'medium',
    outfit: existingAvatar?.outfit || 'casual',
    accessories: existingAvatar?.accessories || 'none',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingAvatar?.avatar_url || null);

  const handleGenerate = async () => {
    try {
      const result = await generateAvatar.mutateAsync(config);
      setPreviewUrl(result.avatar_url);
      toast({ title: 'Avatar generated!', description: 'Your 3D avatar has been created.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate avatar', variant: 'destructive' });
    }
  };

  const handleGenderSelect = (gender: string) => {
    setConfig(prev => ({
      ...prev,
      gender,
      hair_style: gender === 'female' ? 'long' : 'short',
    }));
    setStep('customize');
  };

  const OptionChip = ({ value, selected, onClick, icon }: { value: string; selected: boolean; onClick: () => void; icon?: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
        selected
          ? "bg-primary text-primary-foreground border-primary scale-105"
          : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary hover:scale-105"
      )}
    >
      {icon}{value}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 'gender' ? 'Choose Your Gender' : 'Customize Avatar'}
          </DialogTitle>
        </DialogHeader>

        {step === 'gender' ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-sm text-muted-foreground text-center">
              Select your gender to create a personalized 3D avatar
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => handleGenderSelect('male')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <span className="font-semibold">Male</span>
              </button>
              <button
                onClick={() => handleGenderSelect('female')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-accent-foreground" />
                </div>
                <span className="font-semibold">Female</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 bg-secondary flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              {generateAvatar.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your avatar...
                </div>
              )}
            </div>

            {/* Gender toggle */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5" /> Gender
              </Label>
              <div className="flex gap-2">
                <OptionChip value="Male" selected={config.gender === 'male'} onClick={() => setConfig(p => ({ ...p, gender: 'male' }))} />
                <OptionChip value="Female" selected={config.gender === 'female'} onClick={() => setConfig(p => ({ ...p, gender: 'female' }))} />
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Scissors className="w-3.5 h-3.5" /> Hair Style
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_STYLES.map(h => (
                  <OptionChip key={h} value={h} selected={config.hair_style === h} onClick={() => setConfig(p => ({ ...p, hair_style: h }))} />
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5" /> Hair Color
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_COLORS.map(c => (
                  <OptionChip key={c} value={c} selected={config.hair_color === c} onClick={() => setConfig(p => ({ ...p, hair_color: c }))} />
                ))}
              </div>
            </div>

            {/* Skin Tone */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5" /> Skin Tone
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_TONES.map(s => (
                  <OptionChip key={s} value={s} selected={config.skin_tone === s} onClick={() => setConfig(p => ({ ...p, skin_tone: s }))} />
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Shirt className="w-3.5 h-3.5" /> Outfit
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {OUTFITS.map(o => (
                  <OptionChip key={o} value={o} selected={config.outfit === o} onClick={() => setConfig(p => ({ ...p, outfit: o }))} />
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Gem className="w-3.5 h-3.5" /> Accessories
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ACCESSORIES_LIST.map(a => (
                  <OptionChip key={a} value={a} selected={config.accessories === a} onClick={() => setConfig(p => ({ ...p, accessories: a }))} />
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateAvatar.isPending}
              className="w-full mt-4"
              size="lg"
            >
              {generateAvatar.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {previewUrl ? 'Regenerate Avatar' : 'Generate Avatar'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvatarEditorDialog;
