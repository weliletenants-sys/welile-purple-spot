-- Create tenant status history table
CREATE TABLE public.tenant_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_tenant_status_history_tenant_id ON public.tenant_status_history(tenant_id);
CREATE INDEX idx_tenant_status_history_changed_at ON public.tenant_status_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.tenant_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view status history"
ON public.tenant_status_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert status history"
ON public.tenant_status_history
FOR INSERT
WITH CHECK (true);

-- Create function to automatically track status changes
CREATE OR REPLACE FUNCTION public.track_tenant_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.tenant_status_history (
      tenant_id,
      old_status,
      new_status,
      changed_by,
      reason,
      notes
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      COALESCE(NEW.edited_by, 'System'),
      NEW.rejection_reason,
      NEW.rejection_notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tenants table
CREATE TRIGGER tenant_status_change_trigger
AFTER INSERT OR UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.track_tenant_status_change();