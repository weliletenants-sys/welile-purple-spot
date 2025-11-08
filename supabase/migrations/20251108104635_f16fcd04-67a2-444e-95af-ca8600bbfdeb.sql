-- Add 'pipeline' to tenant status options
-- First, check if there's a constraint we need to update
-- The status field in tenants table needs to allow 'pipeline' value

-- Update any existing status checks or recreate if needed
-- Since we can't easily alter enums in Postgres, we'll ensure the column accepts the new value
-- The status column is a text field, so no enum to modify

-- Just to be safe, let's add a comment documenting the valid statuses
COMMENT ON COLUMN tenants.status IS 'Valid values: active, pending, review, pipeline, cleared, overdue. Pipeline = minimal info collected, Active = full details, Dormant (auto-calculated) = overdue 40+ days';
