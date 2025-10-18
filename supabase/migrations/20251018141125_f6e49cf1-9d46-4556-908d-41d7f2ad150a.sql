-- Add agent fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN agent_name TEXT NOT NULL DEFAULT '',
ADD COLUMN agent_phone TEXT NOT NULL DEFAULT '';

-- Create agent_earnings table to track all agent earnings
CREATE TABLE public.agent_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_phone TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.daily_payments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  earning_type TEXT NOT NULL CHECK (earning_type IN ('signup_bonus', 'commission')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on agent_earnings
ALTER TABLE public.agent_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_earnings
CREATE POLICY "Anyone can view agent earnings"
ON public.agent_earnings FOR SELECT
USING (true);

CREATE POLICY "Anyone can create agent earnings"
ON public.agent_earnings FOR INSERT
WITH CHECK (true);

-- Create index for faster agent phone searches
CREATE INDEX idx_tenants_agent_phone ON public.tenants(agent_phone);
CREATE INDEX idx_agent_earnings_agent_phone ON public.agent_earnings(agent_phone);