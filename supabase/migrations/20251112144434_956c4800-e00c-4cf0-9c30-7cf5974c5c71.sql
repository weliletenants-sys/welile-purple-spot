-- Create team_messages table for team chat functionality
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  user_identifier TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for team messages
CREATE POLICY "Team members can view their team messages"
ON public.team_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_messages.team_id
    AND team_members.user_identifier = auth.uid()::text
  )
);

CREATE POLICY "Team members can send messages to their team"
ON public.team_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_messages.team_id
    AND team_members.user_identifier = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their own messages"
ON public.team_messages
FOR DELETE
USING (user_identifier = auth.uid()::text);

-- Enable realtime for team messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- Create index for better query performance
CREATE INDEX idx_team_messages_team_id ON public.team_messages(team_id);
CREATE INDEX idx_team_messages_created_at ON public.team_messages(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_team_messages_updated_at
BEFORE UPDATE ON public.team_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();