-- Create a function to validate and correct agent data before inserting earnings
CREATE OR REPLACE FUNCTION public.validate_agent_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_agent_phone text;
  v_agent_id uuid;
BEGIN
  -- Try to find the agent by name (case-insensitive)
  SELECT id, phone INTO v_agent_id, v_agent_phone
  FROM public.agents
  WHERE UPPER(name) = UPPER(NEW.agent_name)
  AND is_active = true
  LIMIT 1;
  
  -- If agent found, validate and correct the phone number
  IF v_agent_id IS NOT NULL THEN
    -- If the provided phone is empty or doesn't match, use the correct one
    IF NEW.agent_phone IS NULL OR NEW.agent_phone = '' OR NEW.agent_phone = '0000000000' THEN
      NEW.agent_phone := COALESCE(v_agent_phone, '');
    ELSIF v_agent_phone IS NOT NULL AND v_agent_phone != '' AND NEW.agent_phone != v_agent_phone THEN
      -- Phone mismatch detected - use the correct one from agents table
      RAISE NOTICE 'Agent phone mismatch for %: provided %, corrected to %', 
        NEW.agent_name, NEW.agent_phone, v_agent_phone;
      NEW.agent_phone := v_agent_phone;
    END IF;
  ELSE
    -- Agent not found in agents table - log warning but allow insert
    RAISE NOTICE 'Agent % not found in agents table', NEW.agent_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate agent earnings before insert
DROP TRIGGER IF EXISTS validate_agent_earnings_trigger ON public.agent_earnings;
CREATE TRIGGER validate_agent_earnings_trigger
  BEFORE INSERT ON public.agent_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_agent_earnings();

-- Create an index on agent_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_name_upper ON public.agents (UPPER(name)) WHERE is_active = true;