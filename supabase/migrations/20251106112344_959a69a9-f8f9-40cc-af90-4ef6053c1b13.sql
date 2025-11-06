-- Create table for tracking tenant service center transfers
CREATE TABLE public.tenant_service_center_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_service_center TEXT,
  to_service_center TEXT NOT NULL,
  transferred_by TEXT NOT NULL,
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenant_service_center_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing and inserting transfers
CREATE POLICY "Anyone can view transfer history"
  ON public.tenant_service_center_transfers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert transfers"
  ON public.tenant_service_center_transfers
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_tenant_service_center_transfers_tenant_id 
  ON public.tenant_service_center_transfers(tenant_id);

CREATE INDEX idx_tenant_service_center_transfers_transferred_at 
  ON public.tenant_service_center_transfers(transferred_at DESC);