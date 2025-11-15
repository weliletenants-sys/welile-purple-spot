-- Drop existing check constraints
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_status_check;
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_rent_amount_check;

-- Add updated status check constraint to include 'pipeline'
ALTER TABLE public.tenants ADD CONSTRAINT tenants_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'review'::text, 'cleared'::text, 'overdue'::text, 'pipeline'::text]));

-- Add updated rent amount check to allow 0 for pipeline tenants
ALTER TABLE public.tenants ADD CONSTRAINT tenants_rent_amount_check 
CHECK (rent_amount >= 0);