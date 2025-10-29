-- Create comments table for tenant comments
CREATE TABLE public.tenant_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  commenter_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenant_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view comments" 
ON public.tenant_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert comments" 
ON public.tenant_comments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their comments" 
ON public.tenant_comments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete comments" 
ON public.tenant_comments 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tenant_comments_updated_at
BEFORE UPDATE ON public.tenant_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_tenant_comments_tenant_id ON public.tenant_comments(tenant_id);
CREATE INDEX idx_tenant_comments_created_at ON public.tenant_comments(created_at DESC);