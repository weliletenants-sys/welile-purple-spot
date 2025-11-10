-- Add activity tracking columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_logins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_action_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_action_type text;

-- Create agent activity log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  agent_phone text NOT NULL,
  action_type text NOT NULL,
  action_description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on agent_activity_log
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_activity_log
CREATE POLICY "Anyone can view activity logs"
  ON public.agent_activity_log
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert activity logs"
  ON public.agent_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON public.agent_activity_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created_at ON public.agent_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_phone ON public.agent_activity_log(agent_phone);

-- Create a function to log agent activity
CREATE OR REPLACE FUNCTION public.log_agent_activity(
  p_agent_id uuid,
  p_agent_name text,
  p_agent_phone text,
  p_action_type text,
  p_action_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert into activity log
  INSERT INTO public.agent_activity_log (
    agent_id,
    agent_name,
    agent_phone,
    action_type,
    action_description,
    metadata
  )
  VALUES (
    p_agent_id,
    p_agent_name,
    p_agent_phone,
    p_action_type,
    p_action_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  -- Update agent's last action info
  UPDATE public.agents
  SET 
    last_action_at = now(),
    last_action_type = p_action_type
  WHERE id = p_agent_id;
  
  RETURN v_log_id;
END;
$$;

-- Create a function to record agent login
CREATE OR REPLACE FUNCTION public.record_agent_login(
  p_agent_id uuid,
  p_agent_name text,
  p_agent_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update login tracking
  UPDATE public.agents
  SET 
    last_login_at = now(),
    total_logins = COALESCE(total_logins, 0) + 1,
    last_action_at = now(),
    last_action_type = 'login'
  WHERE id = p_agent_id;
  
  -- Log the activity
  INSERT INTO public.agent_activity_log (
    agent_id,
    agent_name,
    agent_phone,
    action_type,
    action_description
  )
  VALUES (
    p_agent_id,
    p_agent_name,
    p_agent_phone,
    'login',
    'Agent logged into the system'
  );
END;
$$;