-- Add source column to track how tenant was added
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Add index for better performance when filtering by source
CREATE INDEX IF NOT EXISTS idx_tenants_source ON public.tenants(source);

-- Add comment to document the column
COMMENT ON COLUMN public.tenants.source IS 'How the tenant was added: manual, bulk_upload, auto_import';