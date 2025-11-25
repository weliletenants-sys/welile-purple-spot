-- Add user_id column to agents table to link with auth.users
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);

-- Update RLS policy for tenants table to restrict access by agent
DROP POLICY IF EXISTS "Anyone can view all tenants" ON public.tenants;

-- Create new policy: Agents can only view their own tenants
CREATE POLICY "Agents can view their own tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Create policy: Authenticated users with admin role can view all tenants
CREATE POLICY "Admins can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update agents RLS policies
DROP POLICY IF EXISTS "Anyone can view all agents" ON public.agents;
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;

-- Agents can view their own profile
CREATE POLICY "Agents can view their own profile"
ON public.agents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all agents
CREATE POLICY "Admins can view all agents"
ON public.agents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update agent_earnings RLS to restrict by agent
DROP POLICY IF EXISTS "Anyone can view all earnings" ON public.agent_earnings;

-- Agents can view their own earnings
CREATE POLICY "Agents can view their own earnings"
ON public.agent_earnings
FOR SELECT
TO authenticated
USING (
  agent_phone IN (
    SELECT phone FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Admins can view all earnings
CREATE POLICY "Admins can view all earnings"
ON public.agent_earnings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);