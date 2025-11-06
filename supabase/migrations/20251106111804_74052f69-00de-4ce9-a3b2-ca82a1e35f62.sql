-- Add service_center column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN service_center text;