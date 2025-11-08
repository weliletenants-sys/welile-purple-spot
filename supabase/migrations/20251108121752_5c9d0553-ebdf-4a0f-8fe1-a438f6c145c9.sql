-- Create reports table to store generated reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  report_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_reports table to manage report schedules
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports (viewable by authenticated users)
CREATE POLICY "Reports are viewable by authenticated users" 
ON public.reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Reports can be created by service role" 
ON public.reports 
FOR INSERT 
WITH CHECK (true);

-- Create policies for scheduled_reports (manageable by authenticated users)
CREATE POLICY "Scheduled reports are viewable by authenticated users" 
ON public.scheduled_reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Scheduled reports can be managed by authenticated users" 
ON public.scheduled_reports 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_type_date ON public.reports(report_type, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

-- Create trigger for scheduled_reports updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();