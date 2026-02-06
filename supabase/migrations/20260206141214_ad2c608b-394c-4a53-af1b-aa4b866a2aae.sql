-- Add location and cost of living fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'US',
ADD COLUMN IF NOT EXISTS col_multiplier numeric DEFAULT 1.0;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.col_multiplier IS 'Cost of Living multiplier for regional pricing (1.0 = national average)';