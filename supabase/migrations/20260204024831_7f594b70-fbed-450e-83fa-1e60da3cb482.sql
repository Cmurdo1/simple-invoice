-- Add estimate_color column to profiles for separate invoice/estimate branding
ALTER TABLE public.profiles 
ADD COLUMN estimate_color text DEFAULT '#2563eb';

-- Rename brand_color to invoice_color for clarity (keeping brand_color as alias)
COMMENT ON COLUMN public.profiles.brand_color IS 'Primary invoice brand color (hex format)';
COMMENT ON COLUMN public.profiles.estimate_color IS 'Estimate document brand color (hex format)';