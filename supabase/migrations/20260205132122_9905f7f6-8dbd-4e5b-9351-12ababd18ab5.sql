-- Add shipping columns to requests table
ALTER TABLE public.requests
ADD COLUMN shipping_cost numeric NOT NULL DEFAULT 0,
ADD COLUMN express_shipping boolean NOT NULL DEFAULT false;