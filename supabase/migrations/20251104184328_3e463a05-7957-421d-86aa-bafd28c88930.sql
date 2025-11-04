-- Add recording_bonus to the allowed earning types
ALTER TABLE agent_earnings DROP CONSTRAINT IF EXISTS agent_earnings_earning_type_check;

ALTER TABLE agent_earnings ADD CONSTRAINT agent_earnings_earning_type_check 
CHECK (earning_type IN ('commission', 'withdrawal', 'signup_bonus', 'data_entry', 'recording_bonus'));