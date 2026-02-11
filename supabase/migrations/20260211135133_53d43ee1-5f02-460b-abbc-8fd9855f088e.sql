
-- Allow admins to insert requests for any user
CREATE POLICY "Admins can create requests for any user"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert request items for any request
CREATE POLICY "Admins can insert request items"
ON public.request_items
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
