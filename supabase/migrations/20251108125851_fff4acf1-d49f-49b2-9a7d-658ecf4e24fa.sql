-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_identifier)
);

-- Create monthly challenges table
CREATE TABLE public.monthly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  badge_reward UUID REFERENCES public.badges(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge progress table
CREATE TABLE public.challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.monthly_challenges(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_identifier)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Team creators can update their teams"
  ON public.teams FOR UPDATE
  USING (true);

-- Team members policies
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can leave teams"
  ON public.team_members FOR DELETE
  USING (true);

-- Monthly challenges policies
CREATE POLICY "Anyone can view challenges"
  ON public.monthly_challenges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage challenges"
  ON public.monthly_challenges FOR ALL
  USING (true);

-- Challenge progress policies
CREATE POLICY "Anyone can view progress"
  ON public.challenge_progress FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert progress"
  ON public.challenge_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their progress"
  ON public.challenge_progress FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_identifier ON public.team_members(user_identifier);
CREATE INDEX idx_challenge_progress_challenge_id ON public.challenge_progress(challenge_id);
CREATE INDEX idx_challenge_progress_user_identifier ON public.challenge_progress(user_identifier);
CREATE INDEX idx_monthly_challenges_active ON public.monthly_challenges(is_active, start_date, end_date);

-- Insert sample monthly challenges
INSERT INTO public.monthly_challenges (title, description, challenge_type, target_value, points_reward, start_date, end_date, is_active) VALUES
('Tenant Master', 'Add 10 new tenants this month', 'tenants_added', 10, 500, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', true),
('Payment Champion', 'Record 50 payments this month', 'payments_recorded', 50, 750, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', true),
('Perfect Week', 'Record payments every day for 7 consecutive days', 'daily_streak', 7, 300, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', true),
('Report Expert', 'Generate 5 reports this month', 'reports_generated', 5, 250, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', true);

-- Create trigger for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();