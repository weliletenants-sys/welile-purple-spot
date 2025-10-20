-- Drop all RLS policies since RLS is now disabled on these tables

-- Drop policies on tenants table
DROP POLICY IF EXISTS "Anyone can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can view tenants" ON public.tenants;

-- Drop policies on daily_payments table
DROP POLICY IF EXISTS "Anyone can create payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Anyone can delete payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON public.daily_payments;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.daily_payments;

-- Drop policies on agent_earnings table
DROP POLICY IF EXISTS "Anyone can create agent earnings" ON public.agent_earnings;
DROP POLICY IF EXISTS "Anyone can view agent earnings" ON public.agent_earnings;