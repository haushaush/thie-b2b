
-- 1. Remove the duplicate trigger that causes double-decrement
DROP TRIGGER IF EXISTS on_request_item_insert ON public.request_items;
DROP FUNCTION IF EXISTS public.reduce_available_units_on_request();

-- 2. Fix negative inventory: add back the extra decrement caused by the trigger
UPDATE products p
SET available_units = p.available_units + COALESCE(
  (SELECT SUM(ri.quantity) FROM request_items ri WHERE ri.product_id = p.id), 0
);
