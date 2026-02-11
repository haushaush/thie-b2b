
-- When request_items are inserted, reduce available_units on products
CREATE OR REPLACE FUNCTION public.reduce_available_units_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET available_units = available_units - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_item_insert
AFTER INSERT ON public.request_items
FOR EACH ROW
EXECUTE FUNCTION public.reduce_available_units_on_request();

-- When a request is rejected, restore units
CREATE OR REPLACE FUNCTION public.restore_units_on_rejection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    UPDATE public.products p
    SET available_units = p.available_units + ri.quantity
    FROM public.request_items ri
    WHERE ri.request_id = NEW.id AND ri.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_rejected
AFTER UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.restore_units_on_rejection();
