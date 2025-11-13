-- Improve the trigger function to handle case-insensitive name matching
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
  
  -- If still no match, try case-insensitive name matching
  IF NEW.agent_id IS NULL AND NEW.agent_name IS NOT NULL THEN
    SELECT id INTO NEW.agent_id
    FROM public.agents
    WHERE UPPER(name) = UPPER(NEW.agent_name)
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;