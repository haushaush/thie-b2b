
-- Clean up all expired cart reservations and restore inventory
-- First restore units for ALL expired reservations
UPDATE products p
SET available_units = p.available_units + cr.quantity
FROM cart_reservations cr
WHERE cr.product_id = p.id AND cr.expires_at < now();

-- Then delete all expired reservations
DELETE FROM cart_reservations WHERE expires_at < now();

-- Create a function to automatically clean up expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT product_id, quantity FROM cart_reservations WHERE expires_at < now()
  LOOP
    UPDATE products SET available_units = available_units + r.quantity WHERE id = r.product_id;
  END LOOP;
  
  DELETE FROM cart_reservations WHERE expires_at < now();
END;
$function$;
