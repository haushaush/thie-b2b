
-- Cart reservations table for temporary product blocking
CREATE TABLE public.cart_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

-- Users can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.cart_reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reservations
CREATE POLICY "Users can insert own reservations"
  ON public.cart_reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reservations
CREATE POLICY "Users can delete own reservations"
  ON public.cart_reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.cart_reservations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete all reservations
CREATE POLICY "Admins can delete all reservations"
  ON public.cart_reservations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to reserve products (atomically decrement available_units)
CREATE OR REPLACE FUNCTION public.reserve_product(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrement available units
  UPDATE products
  SET available_units = available_units - p_quantity
  WHERE id = p_product_id AND available_units >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough units available';
  END IF;

  -- Upsert reservation (add to existing or create new)
  INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
  VALUES (auth.uid(), p_product_id, p_quantity, now() + interval '1 minute')
  ON CONFLICT DO NOTHING;
  
  -- If no insert happened, update existing
  UPDATE cart_reservations
  SET quantity = quantity + p_quantity,
      expires_at = now() + interval '1 minute'
  WHERE user_id = auth.uid() AND product_id = p_product_id;
END;
$$;

-- Function to release all reservations for a user
CREATE OR REPLACE FUNCTION public.release_user_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT product_id, quantity FROM cart_reservations WHERE user_id = auth.uid()
  LOOP
    UPDATE products SET available_units = available_units + r.quantity WHERE id = r.product_id;
  END LOOP;
  
  DELETE FROM cart_reservations WHERE user_id = auth.uid();
END;
$$;

-- Function to reset reservation timer (called when new product added)
CREATE OR REPLACE FUNCTION public.reset_reservation_timer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cart_reservations
  SET expires_at = now() + interval '1 minute'
  WHERE user_id = auth.uid();
END;
$$;

-- Add unique constraint for upsert
ALTER TABLE public.cart_reservations
  ADD CONSTRAINT cart_reservations_user_product_unique UNIQUE (user_id, product_id);
