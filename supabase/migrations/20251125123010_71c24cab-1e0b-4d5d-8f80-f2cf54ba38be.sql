-- Add category field to tenant_comments table
ALTER TABLE public.tenant_comments 
ADD COLUMN IF NOT EXISTS category text;

-- Add comment to describe the category field
COMMENT ON COLUMN public.tenant_comments.category IS 'Payment method category: cash, mobile_money, etc.';