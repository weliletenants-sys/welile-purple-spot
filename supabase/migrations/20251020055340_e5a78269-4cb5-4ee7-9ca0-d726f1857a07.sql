-- Enable realtime for tenants and daily_payments tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_payments;