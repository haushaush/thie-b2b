-- Add new columns to profiles table for extended profile information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload their own company logo
CREATE POLICY "Users can upload their own company logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own company logo
CREATE POLICY "Users can update their own company logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own company logo
CREATE POLICY "Users can delete their own company logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);