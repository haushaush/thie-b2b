CREATE OR REPLACE FUNCTION public.reserve_product(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  UPDATE products
  SET available_units = available_units - p_quantity
  WHERE id = p_product_id AND available_units >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough units available';
  END IF;

  INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
  VALUES (auth.uid(), p_product_id, p_quantity, now() + interval '2 minutes')
  ON CONFLICT DO NOTHING;
  
  UPDATE cart_reservations
  SET quantity = quantity + p_quantity,
      expires_at = now() + interval '2 minutes'
  WHERE user_id = auth.uid() AND product_id = p_product_id;
END;
$$;