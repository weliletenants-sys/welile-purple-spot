-- Create team_activities table for tracking team member actions
CREATE TABLE public.team_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  user_identifier TEXT NOT NULL,
  user_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for team members to view their team activities
CREATE POLICY "Team members can view their team activities"
ON public.team_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_activities.team_id
    AND team_members.user_identifier = auth.uid()::text
  )
);

-- Create policy for inserting activities
CREATE POLICY "Anyone can insert team activities"
ON public.team_activities
FOR INSERT
WITH CHECK (true);

-- Enable realtime for team activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activities;

-- Create indexes for better query performance
CREATE INDEX idx_team_activities_team_id ON public.team_activities(team_id);
CREATE INDEX idx_team_activities_created_at ON public.team_activities(created_at DESC);
CREATE INDEX idx_team_activities_activity_type ON public.team_activities(activity_type);