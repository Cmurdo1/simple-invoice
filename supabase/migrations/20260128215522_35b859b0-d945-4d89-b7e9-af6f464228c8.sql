-- Create storage bucket for business assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'logos'
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-assets' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to business assets
CREATE POLICY "Business assets are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-assets');