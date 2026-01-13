-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create requests table
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  admin_message TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_items table
CREATE TABLE public.request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own requests
CREATE POLICY "Users can create their own requests"
ON public.requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update any request (for approve/reject)
CREATE POLICY "Admins can update any request"
ON public.requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for request_items
-- Users can view items of their own requests
CREATE POLICY "Users can view their own request items"
ON public.request_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.requests
    WHERE requests.id = request_items.request_id
    AND requests.user_id = auth.uid()
  )
);

-- Admins can view all request items
CREATE POLICY "Admins can view all request items"
ON public.request_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert items for their own requests
CREATE POLICY "Users can insert their own request items"
ON public.request_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.requests
    WHERE requests.id = request_items.request_id
    AND requests.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();