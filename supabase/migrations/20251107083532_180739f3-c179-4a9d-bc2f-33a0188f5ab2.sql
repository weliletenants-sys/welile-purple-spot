-- Create table to store forecast predictions
CREATE TABLE public.payment_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_date DATE NOT NULL,
  target_date DATE NOT NULL,
  expected_amount NUMERIC NOT NULL,
  forecast_amount NUMERIC NOT NULL,
  collection_rate NUMERIC NOT NULL,
  days_ahead INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing and inserting forecasts
CREATE POLICY "Anyone can view forecasts"
ON public.payment_forecasts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert forecasts"
ON public.payment_forecasts
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_payment_forecasts_target_date ON public.payment_forecasts(target_date);
CREATE INDEX idx_payment_forecasts_forecast_date ON public.payment_forecasts(forecast_date);

-- Add comment
COMMENT ON TABLE public.payment_forecasts IS 'Stores historical payment forecasts for accuracy tracking';
