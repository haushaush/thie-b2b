ALTER TABLE public.request_items DROP CONSTRAINT request_items_product_id_fkey;
ALTER TABLE public.request_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.request_items ADD CONSTRAINT request_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;