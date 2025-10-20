-- Add registration_fee and access_fee columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN registration_fee numeric DEFAULT 10000,
ADD COLUMN access_fee numeric DEFAULT 0;

-- Update existing records to calculate and store their fees
UPDATE public.tenants 
SET 
  registration_fee = CASE WHEN rent_amount <= 200000 THEN 10000 ELSE 20000 END,
  access_fee = ROUND(rent_amount * (POWER(1 + 0.33, repayment_days / 30.0) - 1));

-- Make the columns non-nullable now that we have values
ALTER TABLE public.tenants 
ALTER COLUMN registration_fee SET NOT NULL,
ALTER COLUMN access_fee SET NOT NULL;