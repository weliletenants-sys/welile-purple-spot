-- Create report templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  view_options JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for report templates
CREATE POLICY "Report templates are viewable by authenticated users" 
ON public.report_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create report templates" 
ON public.report_templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own templates" 
ON public.report_templates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" 
ON public.report_templates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON public.report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_default ON public.report_templates(is_default);

-- Create trigger for report_templates updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.report_templates (name, description, report_type, metrics, filters, view_options, is_default) VALUES
(
  'Standard Daily Report',
  'Complete daily overview with all key metrics',
  'daily',
  '["totalTenants", "totalPayments", "totalWithdrawals", "pendingWithdrawals", "collectionRate", "topAgents"]'::jsonb,
  '{}'::jsonb,
  '{"includeCharts": true, "includeAgentBreakdown": true, "includeServiceCenterStats": true}'::jsonb,
  true
),
(
  'Executive Summary',
  'High-level overview for executives',
  'weekly',
  '["totalRevenue", "collectionRate", "tenantGrowth", "topPerformers"]'::jsonb,
  '{}'::jsonb,
  '{"includeCharts": true, "includeAgentBreakdown": false, "includeServiceCenterStats": false}'::jsonb,
  false
),
(
  'Agent Performance Report',
  'Detailed agent performance metrics',
  'monthly',
  '["topAgents", "agentEarnings", "agentSignups", "agentRecordings"]'::jsonb,
  '{}'::jsonb,
  '{"includeCharts": true, "includeAgentBreakdown": true, "includeServiceCenterStats": false}'::jsonb,
  false
);