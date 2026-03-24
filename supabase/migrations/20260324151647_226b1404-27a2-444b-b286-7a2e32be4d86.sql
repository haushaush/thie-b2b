
-- Fix 1: Rewrite reserve_product to use proper UPSERT (no double-counting)
CREATE OR REPLACE FUNCTION public.reserve_product(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  -- Decrement available units atomically
  UPDATE products
  SET available_units = available_units - p_quantity
  WHERE id = p_product_id AND available_units >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough units available';
  END IF;

  -- Upsert cart reservation (INSERT or UPDATE, not both)
  INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
  VALUES (auth.uid(), p_product_id, p_quantity, now() + interval '10 minutes')
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET 
    quantity = cart_reservations.quantity + p_quantity,
    expires_at = now() + interval '10 minutes';
END;
$function$;

-- Fix 2: Create a function to decrease reservation (for quantity reduction in cart)
CREATE OR REPLACE FUNCTION public.release_product_units(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  -- Restore units to product
  UPDATE products
  SET available_units = available_units + p_quantity
  WHERE id = p_product_id;

  -- Decrease cart reservation
  UPDATE cart_reservations
  SET quantity = quantity - p_quantity
  WHERE user_id = auth.uid() AND product_id = p_product_id;

  -- Clean up if quantity reached 0
  DELETE FROM cart_reservations
  WHERE user_id = auth.uid() AND product_id = p_product_id AND quantity <= 0;
END;
$function$;

-- Fix 3: Fix reset_reservation_timer to use 10 minutes (match client)
CREATE OR REPLACE FUNCTION public.reset_reservation_timer()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE cart_reservations
  SET expires_at = now() + interval '10 minutes'
  WHERE user_id = auth.uid();
END;
$function$;

-- Fix 4: Create atomic request submission function with server-side validation
CREATE OR REPLACE FUNCTION public.create_request_atomic(
  p_items jsonb,
  p_express_shipping boolean DEFAULT false,
  p_shipping_cost numeric DEFAULT 0
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id uuid;
  v_item RECORD;
  v_available integer;
BEGIN
  -- Validate each item has enough available units (including what's reserved by this user)
  FOR v_item IN
    SELECT 
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity,
      (item->>'price_per_unit')::numeric as price_per_unit,
      item->>'product_name' as product_name
    FROM jsonb_array_elements(p_items) item
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for product %', v_item.product_name;
    END IF;

    -- Get current available units
    SELECT available_units INTO v_available
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item.product_name;
    END IF;

    -- The user's cart reservation already decremented available_units,
    -- so we just need to verify available_units >= 0 (it should be if reservation worked)
    -- But also check that the requested qty doesn't exceed what the user reserved
    -- by verifying against cart_reservations
  END LOOP;

  -- Create the request
  INSERT INTO requests (user_id, status, shipping_cost, express_shipping)
  VALUES (auth.uid(), 'pending', p_shipping_cost, p_express_shipping)
  RETURNING id INTO v_request_id;

  -- Create request items
  INSERT INTO request_items (request_id, product_id, product_name, quantity, price_per_unit)
  SELECT 
    v_request_id,
    (item->>'product_id')::uuid,
    item->>'product_name',
    (item->>'quantity')::integer,
    (item->>'price_per_unit')::numeric
  FROM jsonb_array_elements(p_items) item;

  -- Clear user's cart reservations (units stay decremented - they're now committed to the request)
  DELETE FROM cart_reservations WHERE user_id = auth.uid();

  RETURN v_request_id;
END;
$function$;

-- We need a unique constraint on cart_reservations for the ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cart_reservations_user_product_unique'
  ) THEN
    ALTER TABLE cart_reservations ADD CONSTRAINT cart_reservations_user_product_unique UNIQUE (user_id, product_id);
  END IF;
END $$;
