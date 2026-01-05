import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BadgeCheck, 
  Copy, 
  Check, 
  Users, 
  Gift, 
  Sparkles,
  Share2,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { useVerification, useReferrals, useProcessReferral } from '@/hooks/useVerification';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import NovaBadge from '@/components/profile/NovaBadge';

interface VerificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VerificationSheet = ({ open, onOpenChange }: VerificationSheetProps) => {
  const { verification, isLoading, refetch } = useVerification();
  const { referrals, isLoading: referralsLoading } = useReferrals();
  const processReferral = useProcessReferral();
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState('');

  const points = verification?.points ?? 0;
  const maxPoints = 20;
  const progress = (points / maxPoints) * 100;
  const isVerified = verification?.is_verified ?? false;
  const wasReferred = verification?.was_referred ?? false;
  const referralCode = verification?.referral_code ?? '';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return;
    await processReferral.mutateAsync(referralInput.trim().toUpperCase());
    setReferralInput('');
    refetch();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Novagram!',
          text: `Join me on Novagram and we both get points towards verification! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-primary" />
            Get Nova Verified
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 pb-8">
            {/* Verification Status */}
            <div className={cn(
              "relative p-6 rounded-2xl overflow-hidden",
              isVerified 
                ? "bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" 
                : "bg-secondary/50"
            )}>
              {isVerified && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
                  <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '-1s' }} />
                </div>
              )}
              
              <div className="relative z-10 text-center">
                {isVerified ? (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-nova-badge">
                          <BadgeCheck className="w-10 h-10 text-white" />
                        </div>
                        <PartyPopper className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-bounce" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      You're Nova Verified!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your profile now displays the exclusive Nova badge
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        <BadgeCheck className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold">Get Verified</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Earn 20 points through referrals to unlock your Nova badge
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Progress Section */}
            {!isVerified && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Progress</span>
                  <span className="text-sm text-muted-foreground">{points} / {maxPoints} points</span>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-3" />
                  <div 
                    className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 blur-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    <span>+5 points per friend invited</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>+3 points when you join with code</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Your Referral Link */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Your Referral Link</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    value={referralCode}
                    readOnly
                    className="font-mono text-center font-bold tracking-widest"
                  />
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={handleCopyCode}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    value={referralLink}
                    readOnly
                    className="text-xs text-muted-foreground"
                  />
                  <Button 
                    onClick={handleShare}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Apply Referral Code - Only show if not already referred */}
            {!wasReferred && !isVerified && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Have a Referral Code?</h4>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="Enter referral code"
                      className="font-mono uppercase tracking-widest"
                    />
                    <Button 
                      onClick={handleApplyReferral}
                      disabled={processReferral.isPending || !referralInput.trim()}
                    >
                      {processReferral.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can only use one referral code and it must be applied before earning your own referrals
                  </p>
                </div>

                <Separator />
              </>
            )}

            {/* Referral History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Your Referrals</h4>
                </div>
                <span className="text-sm text-muted-foreground">
                  {referrals.length} friend{referrals.length !== 1 ? 's' : ''} invited
                </span>
              </div>

              {referralsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No referrals yet</p>
                  <p className="text-xs">Share your link to start earning points!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((referral) => (
                    <div 
                      key={referral.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 animate-fade-in"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={referral.referred_profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {referral.referred_profile?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          @{referral.referred_profile?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        +5
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default VerificationSheet;
