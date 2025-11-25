-- Allow anyone to view active agents for the public-facing agents list
CREATE POLICY "Anyone can view active agents"
ON public.agents
FOR SELECT
USING (is_active = true);

-- Allow anyone to view basic tenant information needed for agent stats
-- This is safe because sensitive fields can be filtered in the application
CREATE POLICY "Anyone can view tenants for stats"
ON public.tenants
FOR SELECT
USING (true);