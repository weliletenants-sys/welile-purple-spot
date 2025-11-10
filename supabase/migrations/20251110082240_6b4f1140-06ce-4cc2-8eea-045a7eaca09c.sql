-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policies for agents table
CREATE POLICY "Anyone can view active agents"
  ON public.agents
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view all agents"
  ON public.agents
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert agents"
  ON public.agents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update agents"
  ON public.agents
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete agents"
  ON public.agents
  FOR DELETE
  USING (true);

-- Insert default agents
INSERT INTO public.agents (name, phone) VALUES
  ('MUHWEZI MARTIN', ''),
  ('PAVIN', ''),
  ('MICHEAL', ''),
  ('WYCLIEF', ''),
  ('SHAFIC', '')
ON CONFLICT (name) DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();