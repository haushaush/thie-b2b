-- Add new columns for color and battery health
ALTER TABLE public.products
ADD COLUMN color text,
ADD COLUMN battery_health integer;

-- Add comment for clarity
COMMENT ON COLUMN public.products.battery_health IS 'Average battery health percentage (e.g., 89 for 89%)';