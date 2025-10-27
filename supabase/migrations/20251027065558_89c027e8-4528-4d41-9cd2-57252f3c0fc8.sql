-- Enable REPLICA IDENTITY FULL for all tables
ALTER TABLE public.tenants REPLICA IDENTITY FULL;
ALTER TABLE public.daily_payments REPLICA IDENTITY FULL;
ALTER TABLE public.agent_earnings REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only if not already added)
DO $$
BEGIN
  -- Add daily_payments if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'daily_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_payments;
  END IF;

  -- Add agent_earnings if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'agent_earnings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_earnings;
  END IF;
END $$;