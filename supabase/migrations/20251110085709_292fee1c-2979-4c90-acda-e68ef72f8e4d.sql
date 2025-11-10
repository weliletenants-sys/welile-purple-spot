-- Add payment_mode column to daily_payments table
ALTER TABLE public.daily_payments 
ADD COLUMN payment_mode text CHECK (payment_mode IN ('MTN Mobile Money', 'Airtel Mobile Money', 'Cash'));