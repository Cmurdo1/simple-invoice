-- Add brand_color column to profiles for custom branding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#228B22';