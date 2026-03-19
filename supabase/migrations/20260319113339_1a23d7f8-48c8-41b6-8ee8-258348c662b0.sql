
-- Add new columns to profiles for Step 2 data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS preferred_contact_method text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS billing_street text,
ADD COLUMN IF NOT EXISTS billing_city text,
ADD COLUMN IF NOT EXISTS billing_zip text,
ADD COLUMN IF NOT EXISTS billing_country text,
ADD COLUMN IF NOT EXISTS billing_email text,
ADD COLUMN IF NOT EXISTS shipping_same_as_billing boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS shipping_street text,
ADD COLUMN IF NOT EXISTS shipping_city text,
ADD COLUMN IF NOT EXISTS shipping_zip text,
ADD COLUMN IF NOT EXISTS shipping_country text,
ADD COLUMN IF NOT EXISTS vat_id text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create contact_persons table
CREATE TABLE IF NOT EXISTS public.contact_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.contact_persons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.contact_persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contact_persons
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contact_persons
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contacts" ON public.contact_persons
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create business_documents table
CREATE TABLE IF NOT EXISTS public.business_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.business_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.business_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.business_documents
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON public.business_documents
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-documents', 'business-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for business-documents bucket
CREATE POLICY "Users upload own business docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users view own business docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own business docs" ON storage.objects
  FOR DELETE USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins view all business docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-documents' AND has_role(auth.uid(), 'admin'));
