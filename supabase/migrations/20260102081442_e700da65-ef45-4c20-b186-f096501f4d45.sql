-- Create app_reports table for users to report issues
CREATE TABLE public.app_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
CREATE POLICY "Users can create their own app reports"
ON public.app_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own app reports"
ON public.app_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all app reports"
ON public.app_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update reports
CREATE POLICY "Admins can update app reports"
ON public.app_reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));