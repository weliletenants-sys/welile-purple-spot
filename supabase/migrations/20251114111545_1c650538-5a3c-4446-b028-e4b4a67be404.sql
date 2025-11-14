-- Add payment_type column to daily_payments table
ALTER TABLE daily_payments 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'actual' CHECK (payment_type IN ('actual', 'adjustment'));