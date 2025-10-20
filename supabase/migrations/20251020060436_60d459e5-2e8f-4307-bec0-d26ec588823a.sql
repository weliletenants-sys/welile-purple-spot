-- Disable Row Level Security on all tables to allow unrestricted access
-- This is appropriate since there's no authentication system in place

ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_earnings DISABLE ROW LEVEL SECURITY;