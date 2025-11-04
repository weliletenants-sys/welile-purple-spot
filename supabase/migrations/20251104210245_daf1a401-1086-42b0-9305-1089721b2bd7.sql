-- Create agent_points table for tracking reward points
CREATE TABLE public.agent_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_phone TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  points_source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view agent points" 
ON public.agent_points 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert agent points" 
ON public.agent_points 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update agent points" 
ON public.agent_points 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agent_points_updated_at
BEFORE UPDATE ON public.agent_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create agent_rewards table for reward redemptions
CREATE TABLE public.agent_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_phone TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.agent_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view agent rewards" 
ON public.agent_rewards 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert agent rewards" 
ON public.agent_rewards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update agent rewards" 
ON public.agent_rewards 
FOR UPDATE 
USING (true);