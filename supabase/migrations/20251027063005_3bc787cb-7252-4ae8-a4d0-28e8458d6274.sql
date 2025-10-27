-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on daily_payments table  
ALTER TABLE public.daily_payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agent_earnings table
ALTER TABLE public.agent_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for tenants table (authenticated users can do everything)
CREATE POLICY "Authenticated users can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (true);

-- Create policies for daily_payments table
CREATE POLICY "Authenticated users can view all payments"
ON public.daily_payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payments"
ON public.daily_payments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
ON public.daily_payments
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payments"
ON public.daily_payments
FOR DELETE
TO authenticated
USING (true);

-- Create policies for agent_earnings table
CREATE POLICY "Authenticated users can view all earnings"
ON public.agent_earnings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert earnings"
ON public.agent_earnings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update earnings"
ON public.agent_earnings
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete earnings"
ON public.agent_earnings
FOR DELETE
TO authenticated
USING (true);