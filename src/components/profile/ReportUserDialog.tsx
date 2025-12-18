import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useReportUser } from '@/hooks/useUserModeration';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

const reportReasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

const ReportUserDialog = ({ open, onOpenChange, userId, username }: ReportUserDialogProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const reportUser = useReportUser();

  const handleSubmit = () => {
    if (!reason) return;
    
    reportUser.mutate(
      { reportedUserId: userId, reason, description: description || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
          setDescription('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report @{username}
          </DialogTitle>
          <DialogDescription>
            Select a reason for reporting this user. Reports are reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {reportReasons.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <RadioGroupItem value={item.value} id={item.value} />
                <Label htmlFor={item.value}>{item.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={!reason || reportUser.isPending}
          >
            {reportUser.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
