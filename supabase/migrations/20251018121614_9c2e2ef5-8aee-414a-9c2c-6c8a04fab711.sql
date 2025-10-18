-- Create tenants table with comprehensive information
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'review', 'cleared', 'overdue')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending', 'overdue', 'cleared')),
  performance INTEGER NOT NULL DEFAULT 80 CHECK (performance >= 0 AND performance <= 100),
  landlord TEXT NOT NULL,
  landlord_contact TEXT NOT NULL,
  rent_amount DECIMAL(12, 2) NOT NULL CHECK (rent_amount > 0),
  repayment_days INTEGER NOT NULL CHECK (repayment_days IN (30, 60, 90)),
  
  -- Guarantor 1
  guarantor1_name TEXT,
  guarantor1_contact TEXT,
  
  -- Guarantor 2
  guarantor2_name TEXT,
  guarantor2_contact TEXT,
  
  -- Location details
  location_country TEXT,
  location_county TEXT,
  location_district TEXT,
  location_subcounty_or_ward TEXT,
  location_cell_or_village TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily payments table
CREATE TABLE public.daily_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_amount DECIMAL(12, 2) CHECK (paid_amount >= 0),
  
  -- Audit trail
  recorded_by TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE,
  modified_by TEXT,
  modified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
-- Allow all authenticated users to view tenants
CREATE POLICY "Anyone can view tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert tenants
CREATE POLICY "Anyone can create tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update tenants
CREATE POLICY "Anyone can update tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (true);

-- Allow all authenticated users to delete tenants
CREATE POLICY "Anyone can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for daily_payments table
-- Allow all authenticated users to view payments
CREATE POLICY "Anyone can view payments"
ON public.daily_payments
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert payments
CREATE POLICY "Anyone can create payments"
ON public.daily_payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update payments
CREATE POLICY "Anyone can update payments"
ON public.daily_payments
FOR UPDATE
TO authenticated
USING (true);

-- Allow all authenticated users to delete payments
CREATE POLICY "Anyone can delete payments"
ON public.daily_payments
FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_payments_updated_at
BEFORE UPDATE ON public.daily_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_payment_status ON public.tenants(payment_status);
CREATE INDEX idx_daily_payments_tenant_id ON public.daily_payments(tenant_id);
CREATE INDEX idx_daily_payments_date ON public.daily_payments(date);
CREATE INDEX idx_daily_payments_paid ON public.daily_payments(paid);