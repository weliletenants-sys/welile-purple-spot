-- Create notifications table for system alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  tenant_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view notifications
CREATE POLICY "Anyone can view notifications" 
ON public.notifications 
FOR SELECT 
USING (true);

-- Allow system to insert notifications
CREATE POLICY "Anyone can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update notifications (mark as read)
CREATE POLICY "Anyone can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (true);

-- Allow anyone to delete old notifications
CREATE POLICY "Anyone can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Add comment
COMMENT ON TABLE public.notifications IS 'System notifications and alerts for managers';
