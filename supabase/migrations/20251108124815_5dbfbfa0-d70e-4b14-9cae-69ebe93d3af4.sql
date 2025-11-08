-- Create achievements/badges system

-- Table for badge definitions
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  category TEXT NOT NULL, -- 'milestone', 'performance', 'streak', 'special'
  criteria JSONB NOT NULL, -- Flexible criteria for earning the badge
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for user achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL, -- Can be agent_phone, agent_name, or user_id
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  progress JSONB, -- Track progress towards multi-step achievements
  is_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_identifier, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for badges (public readable)
CREATE POLICY "Anyone can view badges"
  ON public.badges
  FOR SELECT
  USING (true);

-- Policies for user achievements
CREATE POLICY "Anyone can view achievements"
  ON public.user_achievements
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (true);

-- Create indices for performance
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_identifier);
CREATE INDEX idx_user_achievements_badge ON public.user_achievements(badge_id);
CREATE INDEX idx_user_achievements_earned ON public.user_achievements(earned_at DESC);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, criteria, points, rarity) VALUES
  ('First Steps', 'Added your first tenant to the system', 'UserPlus', 'milestone', '{"type": "tenant_count", "target": 1}', 10, 'common'),
  ('Team Builder', 'Added 10 tenants to the system', 'Users', 'milestone', '{"type": "tenant_count", "target": 10}', 50, 'common'),
  ('Growth Expert', 'Added 50 tenants to the system', 'TrendingUp', 'milestone', '{"type": "tenant_count", "target": 50}', 200, 'rare'),
  ('Master Recruiter', 'Added 100 tenants to the system', 'Award', 'milestone', '{"type": "tenant_count", "target": 100}', 500, 'epic'),
  
  ('Payment Pro', 'Recorded your first payment', 'DollarSign', 'milestone', '{"type": "payment_count", "target": 1}', 10, 'common'),
  ('Collection Champion', 'Recorded 100 payments', 'Coins', 'milestone', '{"type": "payment_count", "target": 100}', 100, 'rare'),
  
  ('Early Bird', 'Recorded payments before 9 AM', 'Sunrise', 'streak', '{"type": "early_recording", "count": 5}', 30, 'common'),
  ('Night Owl', 'Recorded payments after 8 PM', 'Moon', 'streak', '{"type": "late_recording", "count": 5}', 30, 'common'),
  ('Consistency King', 'Recorded payments 7 days in a row', 'Flame', 'streak', '{"type": "daily_streak", "days": 7}', 100, 'rare'),
  
  ('Perfect Score', 'Achieved 100% payment collection rate', 'Target', 'performance', '{"type": "collection_rate", "rate": 100}', 200, 'epic'),
  ('Top Performer', 'Ranked #1 in monthly leaderboard', 'Trophy', 'performance', '{"type": "leaderboard_rank", "rank": 1}', 300, 'legendary'),
  
  ('Report Master', 'Generated your first report', 'FileText', 'milestone', '{"type": "report_count", "target": 1}', 20, 'common'),
  ('Data Analyst', 'Generated 10 reports', 'BarChart', 'milestone', '{"type": "report_count", "target": 10}', 80, 'rare'),
  
  ('Welcome Aboard', 'Completed the onboarding tour', 'Sparkles', 'special', '{"type": "onboarding_complete"}', 5, 'common'),
  ('Explorer', 'Visited all major sections of the app', 'Map', 'special', '{"type": "sections_visited", "count": 8}', 50, 'common');

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  p_user_identifier TEXT,
  p_badge_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Get badge ID
  SELECT id INTO v_badge_id
  FROM public.badges
  WHERE name = p_badge_name;
  
  IF v_badge_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM public.user_achievements
    WHERE user_identifier = p_user_identifier
    AND badge_id = v_badge_id
  ) INTO v_exists;
  
  IF v_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Award the badge
  INSERT INTO public.user_achievements (user_identifier, badge_id)
  VALUES (p_user_identifier, v_badge_id);
  
  RETURN TRUE;
END;
$$;