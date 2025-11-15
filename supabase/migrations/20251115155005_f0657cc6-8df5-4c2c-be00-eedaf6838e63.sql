-- Drop existing earning type check constraint
ALTER TABLE public.agent_earnings DROP CONSTRAINT IF EXISTS agent_earnings_earning_type_check;

-- Add updated earning type check constraint to include 'pipeline_bonus'
ALTER TABLE public.agent_earnings ADD CONSTRAINT agent_earnings_earning_type_check 
CHECK (earning_type = ANY (ARRAY['commission'::text, 'withdrawal'::text, 'signup_bonus'::text, 'data_entry'::text, 'recording_bonus'::text, 'pipeline_bonus'::text]));