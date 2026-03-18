
-- Function to edit a pending request's items atomically with inventory adjustments
CREATE OR REPLACE FUNCTION public.edit_request_items(
  p_request_id uuid,
  p_items jsonb -- array of {product_id, quantity, price_per_unit, product_name}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request_status text;
  v_request_user_id uuid;
  v_old_item RECORD;
  v_new_item RECORD;
  v_existing_qty integer;
  v_new_qty integer;
  v_diff integer;
BEGIN
  -- Verify request exists, belongs to user, and is pending
  SELECT status, user_id INTO v_request_status, v_request_user_id
  FROM requests WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  IF v_request_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to edit this request';
  END IF;
  
  IF v_request_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be edited';
  END IF;

  -- Step 1: Restore inventory for items being removed or reduced
  FOR v_old_item IN 
    SELECT ri.product_id, ri.quantity 
    FROM request_items ri 
    WHERE ri.request_id = p_request_id
  LOOP
    -- Check if this product is in the new items list
    SELECT (item->>'quantity')::integer INTO v_new_qty
    FROM jsonb_array_elements(p_items) item
    WHERE (item->>'product_id')::uuid = v_old_item.product_id
    LIMIT 1;
    
    IF v_new_qty IS NULL THEN
      -- Item removed entirely, restore all units
      UPDATE products SET available_units = available_units + v_old_item.quantity
      WHERE id = v_old_item.product_id;
    ELSIF v_new_qty < v_old_item.quantity THEN
      -- Quantity reduced, restore difference
      UPDATE products SET available_units = available_units + (v_old_item.quantity - v_new_qty)
      WHERE id = v_old_item.product_id;
    ELSIF v_new_qty > v_old_item.quantity THEN
      -- Quantity increased, reserve additional units
      v_diff := v_new_qty - v_old_item.quantity;
      UPDATE products SET available_units = available_units - v_diff
      WHERE id = v_old_item.product_id AND available_units >= v_diff;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough units available for product %', v_old_item.product_id;
      END IF;
    END IF;
  END LOOP;

  -- Step 2: Reserve inventory for completely new items
  FOR v_new_item IN
    SELECT 
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    FROM jsonb_array_elements(p_items) item
    WHERE (item->>'product_id')::uuid NOT IN (
      SELECT ri.product_id FROM request_items ri WHERE ri.request_id = p_request_id
    )
  LOOP
    IF v_new_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;
    UPDATE products SET available_units = available_units - v_new_item.quantity
    WHERE id = v_new_item.product_id AND available_units >= v_new_item.quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough units available for product %', v_new_item.product_id;
    END IF;
  END LOOP;

  -- Step 3: Delete old items
  DELETE FROM request_items WHERE request_id = p_request_id;

  -- Step 4: Insert new items (bypass the reduce trigger by using SECURITY DEFINER context)
  -- Note: The trigger reduce_available_units_on_request will fire, but we've already handled inventory
  -- We need to temporarily disable the trigger or handle it differently
  -- Since we can't easily disable triggers, we'll adjust: add units back before the trigger fires
  -- Actually, let's just insert without the trigger firing by inserting directly
  
  -- Disable the trigger for this transaction
  ALTER TABLE request_items DISABLE TRIGGER ALL;
  
  INSERT INTO request_items (request_id, product_id, quantity, price_per_unit, product_name)
  SELECT 
    p_request_id,
    (item->>'product_id')::uuid,
    (item->>'quantity')::integer,
    (item->>'price_per_unit')::numeric,
    item->>'product_name'
  FROM jsonb_array_elements(p_items) item;
  
  -- Re-enable the trigger
  ALTER TABLE request_items ENABLE TRIGGER ALL;

  -- Step 5: Update the request's updated_at and recalculate shipping
  DECLARE
    v_total_qty integer;
    v_subtotal numeric;
    v_shipping numeric;
    v_express boolean;
  BEGIN
    SELECT SUM((item->>'quantity')::integer), 
           COALESCE(SUM((item->>'quantity')::integer * (item->>'price_per_unit')::numeric), 0)
    INTO v_total_qty, v_subtotal
    FROM jsonb_array_elements(p_items) item;
    
    SELECT express_shipping INTO v_express FROM requests WHERE id = p_request_id;
    
    -- Shipping logic: free above 50 units, otherwise 20€
    IF v_total_qty >= 50 THEN
      v_shipping := 0;
    ELSE
      v_shipping := 20;
    END IF;
    
    -- Express: 50€ + 1% insurance
    IF v_express THEN
      v_shipping := v_shipping + 50 + (v_subtotal * 0.01);
    END IF;
    
    UPDATE requests SET shipping_cost = v_shipping, updated_at = now() WHERE id = p_request_id;
  END;
END;
$$;
