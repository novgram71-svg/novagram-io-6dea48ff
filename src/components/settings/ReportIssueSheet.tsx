import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSubmitAppReport } from '@/hooks/useAppReports';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Bug, HelpCircle, Zap, MessageSquare } from 'lucide-react';

interface ReportIssueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const problemOptions = [
  { value: 'bug', label: 'Bug / Error', icon: Bug, description: 'Something is not working correctly' },
  { value: 'feature', label: 'Feature Request', icon: Zap, description: 'I want a new feature' },
  { value: 'performance', label: 'Performance Issue', icon: AlertCircle, description: 'App is slow or laggy' },
  { value: 'ui', label: 'UI/UX Issue', icon: MessageSquare, description: 'Design or usability problem' },
  { value: 'other', label: 'Other', icon: HelpCircle, description: 'Something else' },
];

export const ReportIssueSheet = ({ open, onOpenChange }: ReportIssueSheetProps) => {
  const [problem, setProblem] = useState('');
  const [details, setDetails] = useState('');
  const submitReport = useSubmitAppReport();

  const handleSubmit = async () => {
    if (!problem) {
      toast.error('Please select a problem type');
      return;
    }

    try {
      await submitReport.mutateAsync({ problem, details });
      toast.success('Report submitted successfully!');
      setProblem('');
      setDetails('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Report an Issue
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="space-y-4">
            <Label className="text-base font-semibold">What issue are you facing?</Label>
            <RadioGroup value={problem} onValueChange={setProblem} className="space-y-3">
              {problemOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      problem === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      problem === option.value ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-base font-semibold">
              Tell us more (optional)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!problem || submitReport.isPending}
            className="w-full"
          >
            {submitReport.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
