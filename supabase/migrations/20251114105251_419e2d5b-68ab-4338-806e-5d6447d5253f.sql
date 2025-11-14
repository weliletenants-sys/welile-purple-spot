-- Create table to store agent edit history for undo functionality
CREATE TABLE IF NOT EXISTS public.agent_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_batch_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  old_name TEXT NOT NULL,
  old_phone TEXT NOT NULL,
  new_name TEXT NOT NULL,
  new_phone TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_by TEXT,
  undone_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_edit_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert edit history"
  ON public.agent_edit_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view edit history"
  ON public.agent_edit_history
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update edit history"
  ON public.agent_edit_history
  FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_agent_edit_history_batch ON public.agent_edit_history(edit_batch_id);
CREATE INDEX idx_agent_edit_history_edited_at ON public.agent_edit_history(edited_at DESC);
CREATE INDEX idx_agent_edit_history_undone ON public.agent_edit_history(undone_at) WHERE undone_at IS NULL;