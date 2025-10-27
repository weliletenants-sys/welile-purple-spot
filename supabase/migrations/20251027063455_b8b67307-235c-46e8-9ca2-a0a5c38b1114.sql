-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can delete tenants" ON public.tenants;

DROP POLICY IF EXISTS "Authenticated users can view all payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.daily_payments;

DROP POLICY IF EXISTS "Authenticated users can view all earnings" ON public.agent_earnings;
DROP POLICY IF EXISTS "Authenticated users can insert earnings" ON public.agent_earnings;
DROP POLICY IF EXISTS "Authenticated users can update earnings" ON public.agent_earnings;
DROP POLICY IF EXISTS "Authenticated users can delete earnings" ON public.agent_earnings;

-- Create new public policies (allow anyone)
CREATE POLICY "Anyone can view all tenants"
ON public.tenants
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert tenants"
ON public.tenants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update tenants"
ON public.tenants
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete tenants"
ON public.tenants
FOR DELETE
USING (true);

-- Create policies for daily_payments table
CREATE POLICY "Anyone can view all payments"
ON public.daily_payments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert payments"
ON public.daily_payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update payments"
ON public.daily_payments
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete payments"
ON public.daily_payments
FOR DELETE
USING (true);

-- Create policies for agent_earnings table
CREATE POLICY "Anyone can view all earnings"
ON public.agent_earnings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert earnings"
ON public.agent_earnings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update earnings"
ON public.agent_earnings
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete earnings"
ON public.agent_earnings
FOR DELETE
USING (true);