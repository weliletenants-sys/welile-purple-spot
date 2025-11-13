-- Add agent_id column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_tenants_agent_id ON public.tenants(agent_id);

-- Update existing tenants to link them to agents by matching phone numbers (normalized)
-- First, update tenants where phone numbers match exactly
UPDATE public.tenants t
SET agent_id = a.id
FROM public.agents a
WHERE t.agent_phone = a.phone
  AND t.agent_id IS NULL;

-- Then, update tenants where phone numbers match after removing spaces
UPDATE public.tenants t
SET agent_id = a.id
FROM public.agents a
WHERE REPLACE(t.agent_phone, ' ', '') = REPLACE(a.phone, ' ', '')
  AND t.agent_id IS NULL;

-- Add a trigger to automatically set agent_id when agent_phone is set
CREATE OR REPLACE FUNCTION public.set_tenant_agent_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find matching agent by phone (exact match first)
  SELECT id INTO NEW.agent_id
  FROM public.agents
  WHERE phone = NEW.agent_phone
  LIMIT 1;
  
  -- If no exact match, try normalized phone (without spaces)
  IF NEW.agent_id IS NULL AND NEW.agent_phone IS NOT NULL THEN
    SELECT id INTO NEW.agent_id
    FROM public.agents
    WHERE REPLACE(phone, ' ', '') = REPLACE(NEW.agent_phone, ' ', '')
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER tenant_set_agent_id
BEFORE INSERT OR UPDATE OF agent_phone ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_agent_id();