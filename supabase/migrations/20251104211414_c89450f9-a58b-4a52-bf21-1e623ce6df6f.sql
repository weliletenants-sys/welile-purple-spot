-- Create authorized_recorders table
CREATE TABLE public.authorized_recorders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authorized_recorders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active recorders" 
ON public.authorized_recorders 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view all recorders" 
ON public.authorized_recorders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert recorders" 
ON public.authorized_recorders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update recorders" 
ON public.authorized_recorders 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete recorders" 
ON public.authorized_recorders 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_authorized_recorders_updated_at
BEFORE UPDATE ON public.authorized_recorders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing authorized recorders
INSERT INTO public.authorized_recorders (name) VALUES
  ('Sharimah'),
  ('Daniel'),
  ('Martin'),
  ('Gloria'),
  ('James'),
  ('Micheal'),
  ('Arnold'),
  ('Mercy'),
  ('Benjamin');